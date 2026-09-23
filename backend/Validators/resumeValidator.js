import mongoose from "mongoose";

import resumeSections from "../Constants/resumeSections.js";
import resumeCustomization from "../Constants/resumeCustomization.js";
import limits from "../Constants/limits.js";

// ============================================================
// CuratoCV Resume Validator
// ============================================================
//
// Request-level validation for resume operations.
//
// Responsibilities:
// - Validate resume payloads
// - Validate personal information
// - Validate design/customization
// - Validate sections
// - Validate entries
// - Validate section-specific data
// - Reject unknown fields
// - Normalize safe non-credential strings
//
// NOT responsible for:
// - MongoDB queries
// - Authentication
// - Authorization
// - AI operations
// - File processing
// - Creating/updating Resume documents
// - HTTP responses
//
// Flow:
//
// Controller
//     ↓
// Validator
//     ↓
// Service
//     ↓
// Repository
//     ↓
// MongoDB
// ============================================================

// ============================================================
// Helpers
// ============================================================

const isPlainObject = (value) => {
    if (
        value === null ||
        typeof value !== "object"
    ) {
        return false;
    }

    const prototype =
        Object.getPrototypeOf(value);

    return (
        prototype === Object.prototype ||
        prototype === null
    );
};

const hasOwn = (
    object,
    key
) =>
    Object.prototype.hasOwnProperty.call(
        object,
        key
    );

const normalizeString = (
    value
) =>
    typeof value === "string"
        ? value.trim()
        : value;

const createError = (
    field,
    message
) => ({
    field,
    message,
});

const createResult = (
    errors,
    data = undefined
) => {
    const result = {
        valid:
            errors.length === 0,

        errors,
    };

    if (
        data !== undefined
    ) {
        result.data = data;
    }

    return result;
};

const validateObject = (
    value,
    field
) => {
    if (
        !isPlainObject(value)
    ) {
        return [
            createError(
                field,
                `${field} must be an object.`
            ),
        ];
    }

    return [];
};

const validateString = (
    value,
    field,
    {
        required = false,
        minLength = 0,
        maxLength = Infinity,
    } = {}
) => {
    const errors = [];

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            errors.push(
                createError(
                    field,
                    `${field} is required.`
                )
            );
        }

        return errors;
    }

    if (
        typeof value !== "string"
    ) {
        errors.push(
            createError(
                field,
                `${field} must be a string.`
            )
        );

        return errors;
    }

    if (
        required &&
        value.trim().length === 0
    ) {
        errors.push(
            createError(
                field,
                `${field} cannot be empty.`
            )
        );

        return errors;
    }

    if (
        value.length < minLength
    ) {
        errors.push(
            createError(
                field,
                `${field} must contain at least ${minLength} characters.`
            )
        );
    }

    if (
        value.length > maxLength
    ) {
        errors.push(
            createError(
                field,
                `${field} cannot exceed ${maxLength} characters.`
            )
        );
    }

    return errors;
};

const validateBoolean = (
    value,
    field
) => {
    if (
        typeof value !== "boolean"
    ) {
        return [
            createError(
                field,
                `${field} must be a boolean.`
            ),
        ];
    }

    return [];
};

const validateNumber = (
    value,
    field,
    {
        min = -Infinity,
        max = Infinity,
        integer = false,
    } = {}
) => {
    const errors = [];

    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        return [
            createError(
                field,
                `${field} must be a finite number.`
            ),
        ];
    }

    if (
        integer &&
        !Number.isInteger(value)
    ) {
        errors.push(
            createError(
                field,
                `${field} must be an integer.`
            )
        );
    }

    if (value < min) {
        errors.push(
            createError(
                field,
                `${field} cannot be less than ${min}.`
            )
        );
    }

    if (value > max) {
        errors.push(
            createError(
                field,
                `${field} cannot exceed ${max}.`
            )
        );
    }

    return errors;
};

const validateEnum = (
    value,
    field,
    allowedValues
) => {
    if (
        !Array.isArray(
            allowedValues
        ) ||
        !allowedValues.includes(
            value
        )
    ) {
        return [
            createError(
                field,
                `${field} contains an unsupported value.`
            ),
        ];
    }

    return [];
};

const validateAllowedFields = (
    object,
    allowedFields,
    prefix
) => {
    const errors = [];

    for (
        const field of Object.keys(
            object
        )
    ) {
        if (
            !allowedFields.has(
                field
            )
        ) {
            errors.push(
                createError(
                    `${prefix}.${field}`,
                    `Field '${field}' is not allowed.`
                )
            );
        }
    }

    return errors;
};

// ============================================================
// Configuration Helpers
// ============================================================

const getPersonalInfoLimit = (
    field
) => {
    return (
        limits.resume
            ?.personalInfo?.[
            field
        ]?.maxLength ??
        2048
    );
};

const getEntryLimit = (
    field
) => {
    return (
        limits.resume
            ?.entries?.[
            field
        ]?.maxLength ??
        10000
    );
};

const getSectionTitleLimit =
    () =>
        limits.resume
            ?.sections?.title
            ?.maxLength ??
        120;

const getSectionTypeLimit =
    () =>
        limits.resume
            ?.design?.templateName
            ?.maxLength ??
        80;

const getCustomSectionTextLimit =
    () =>
        limits.resume
            ?.customSections
            ?.entryContentMaxLength ??
        10000;

const getCustomizationStringLimit =
    () =>
        limits.resume
            ?.customization
            ?.maxStringValueLength ??
        200;

// ============================================================
// MongoDB ObjectId Validation
// ============================================================

const validateObjectId = (
    value,
    field
) => {
    if (
        !mongoose.isValidObjectId(
            value
        )
    ) {
        return [
            createError(
                field,
                `${field} must be a valid identifier.`
            ),
        ];
    }

    return [];
};

// ============================================================
// Personal Information
// ============================================================

const PERSONAL_INFO_FIELDS =
    new Set([
        "fullName",
        "profession",
        "email",
        "phone",
        "location",
        "website",
        "linkedin",
        "github",
        "photo",
    ]);

const validatePersonalInfo = (
    personalInfo
) => {
    const errors = [];

    errors.push(
        ...validateObject(
            personalInfo,
            "personalInfo"
        )
    );

    if (
        !isPlainObject(
            personalInfo
        )
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            personalInfo,
            PERSONAL_INFO_FIELDS,
            "personalInfo"
        )
    );

    const stringFields = [
        "fullName",
        "profession",
        "phone",
        "location",
        "website",
        "linkedin",
        "github",
        "photo",
    ];

    for (
        const field of stringFields
    ) {
        if (
            hasOwn(
                personalInfo,
                field
            )
        ) {
            errors.push(
                ...validateString(
                    personalInfo[field],
                    `personalInfo.${field}`,
                    {
                        maxLength:
                            getPersonalInfoLimit(
                                field
                            ),
                    }
                )
            );
        }
    }

    if (
        hasOwn(
            personalInfo,
            "email"
        )
    ) {
        errors.push(
            ...validateString(
                personalInfo.email,
                "personalInfo.email",
                {
                    maxLength:
                        getPersonalInfoLimit(
                            "email"
                        ),
                }
            )
        );

        if (
            typeof personalInfo.email ===
                "string" &&
            personalInfo.email
                .trim()
                .length > 0 &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                personalInfo.email
                    .trim()
                    .toLowerCase()
            )
        ) {
            errors.push(
                createError(
                    "personalInfo.email",
                    "Please provide a valid email address."
                )
            );
        }
    }

    return errors;
};

// ============================================================
// Design Validation
// ============================================================

const DESIGN_FIELDS =
    new Set([
        "template",
        "colors",
        "typography",
        "spacing",
        "layout",
        "header",
        "footer",
        "photo",
        "links",
    ]);

const COLOR_FIELDS =
    new Set([
        "accent",
        "text",
        "heading",
        "muted",
        "background",
        "border",
    ]);

const validateColor = (
    value,
    field
) => {
    const errors =
        validateString(
            value,
            field,
            {
                required: true,
                maxLength:
                    limits.resume
                        ?.design
                        ?.colorValue
                        ?.maxLength ??
                    30,
            }
        );

    if (
        errors.length === 0 &&
        !/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
            value.trim()
        )
    ) {
        errors.push(
            createError(
                field,
                `${field} must be a valid hexadecimal color.`
            )
        );
    }

    return errors;
};

const validateColors = (
    colors
) => {
    const errors = [];

    errors.push(
        ...validateObject(
            colors,
            "design.colors"
        )
    );

    if (
        !isPlainObject(colors)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            colors,
            COLOR_FIELDS,
            "design.colors"
        )
    );

    for (
        const field of COLOR_FIELDS
    ) {
        if (
            hasOwn(
                colors,
                field
            )
        ) {
            errors.push(
                ...validateColor(
                    colors[field],
                    `design.colors.${field}`
                )
            );
        }
    }

    return errors;
};

const getCustomizationValues = (
    group,
    property
) => {
    const definition =
        group?.[property];

    /*
     * Our customization constants may expose an array
     * directly or an object containing `values`.
     */
    if (
        Array.isArray(
            definition
        )
    ) {
        return definition;
    }

    if (
        Array.isArray(
            definition?.values
        )
    ) {
        return definition.values;
    }

    if (
        Array.isArray(
            definition?.allowedValues
        )
    ) {
        return definition.allowedValues;
    }

    return null;
};

const validateNestedEnumGroup = (
    object,
    field,
    allowedFields,
    definitions
) => {
    const errors = [];

    errors.push(
        ...validateObject(
            object,
            field
        )
    );

    if (
        !isPlainObject(object)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            object,
            allowedFields,
            field
        )
    );

    for (
        const property of allowedFields
    ) {
        if (
            !hasOwn(
                object,
                property
            )
        ) {
            continue;
        }

        const values =
            getCustomizationValues(
                definitions,
                property
            );

        if (
            Array.isArray(values) &&
            values.length > 0
        ) {
            errors.push(
                ...validateEnum(
                    object[property],
                    `${field}.${property}`,
                    values
                )
            );
        } else {
            errors.push(
                ...validateString(
                    object[property],
                    `${field}.${property}`,
                    {
                        required: true,
                        maxLength:
                            getCustomizationStringLimit(),
                    }
                )
            );
        }
    }

    return errors;
};

const validateDesign = (
    design
) => {
    const errors = [];

    errors.push(
        ...validateObject(
            design,
            "design"
        )
    );

    if (
        !isPlainObject(design)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            design,
            DESIGN_FIELDS,
            "design"
        )
    );

    if (
        hasOwn(
            design,
            "template"
        )
    ) {
        errors.push(
            ...validateString(
                design.template,
                "design.template",
                {
                    required: true,
                    maxLength:
                        limits.resume
                            ?.design
                            ?.templateName
                            ?.maxLength ??
                        80,
                }
            )
        );
    }

    if (
        hasOwn(
            design,
            "colors"
        )
    ) {
        errors.push(
            ...validateColors(
                design.colors
            )
        );
    }

    const designGroups = [
        [
            "typography",
            new Set([
                "fontFamily",
                "fontSizeScale",
                "headingScale",
                "lineHeight",
            ]),
            resumeCustomization
                ?.global
                ?.typography,
        ],

        [
            "spacing",
            new Set([
                "density",
                "sectionSpacing",
                "entrySpacing",
            ]),
            resumeCustomization
                ?.global
                ?.spacing,
        ],

        [
            "layout",
            new Set([
                "pageWidth",
                "columns",
                "columnRatio",
                "pageAlignment",
            ]),
            resumeCustomization
                ?.global
                ?.layout,
        ],

        [
            "header",
            new Set([
                "alignment",
                "layout",
            ]),
            resumeCustomization
                ?.global
                ?.header,
        ],

        [
            "footer",
            new Set([
                "visibility",
                "alignment",
            ]),
            resumeCustomization
                ?.global
                ?.footer,
        ],

        [
            "photo",
            new Set([
                "visibility",
                "shape",
                "position",
                "size",
                "fit",
            ]),
            resumeCustomization
                ?.global
                ?.photo,
        ],

        [
            "links",
            new Set([
                "style",
                "target",
            ]),
            resumeCustomization
                ?.global
                ?.links,
        ],
    ];

    for (
        const [
            property,
            allowedFields,
            definitions,
        ] of designGroups
    ) {
        if (
            hasOwn(
                design,
                property
            )
        ) {
            errors.push(
                ...validateNestedEnumGroup(
                    design[property],
                    `design.${property}`,
                    allowedFields,
                    definitions
                )
            );
        }
    }

    return errors;
};

// ============================================================
// Document Settings Validation
// ============================================================

const DOCUMENT_FIELDS =
    new Set([
        "language",
        "dateFormat",
        "pageFormat",
    ]);

const validateDocument = (
    doc
) => {
    const errors = [];

    errors.push(
        ...validateObject(
            doc,
            "document"
        )
    );

    if (
        !isPlainObject(doc)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            doc,
            DOCUMENT_FIELDS,
            "document"
        )
    );

    if (
        hasOwn(
            doc,
            "language"
        )
    ) {
        errors.push(
            ...validateEnum(
                doc.language,
                "document.language",
                resumeCustomization
                    ?.global
                    ?.document
                    ?.language
            )
        );
    }

    if (
        hasOwn(
            doc,
            "dateFormat"
        )
    ) {
        errors.push(
            ...validateEnum(
                doc.dateFormat,
                "document.dateFormat",
                resumeCustomization
                    ?.global
                    ?.document
                    ?.dateFormat
            )
        );
    }

    if (
        hasOwn(
            doc,
            "pageFormat"
        )
    ) {
        errors.push(
            ...validateEnum(
                doc.pageFormat,
                "document.pageFormat",
                resumeCustomization
                    ?.global
                    ?.document
                    ?.pageFormat
            )
        );
    }

    return errors;
};

// ============================================================
// Section Customization
// ============================================================

const SECTION_CUSTOMIZATION_FIELDS =
    new Set([
        "visibility",
        "alignment",
        "headingStyle",
        "headingSize",
        "spacing",
        "divider",
    ]);

const validateSectionCustomization =
    (
        customization,
        field
    ) => {
        const errors = [];

        errors.push(
            ...validateObject(
                customization,
                field
            )
        );

        if (
            !isPlainObject(
                customization
            )
        ) {
            return errors;
        }

        errors.push(
            ...validateAllowedFields(
                customization,
                SECTION_CUSTOMIZATION_FIELDS,
                field
            )
        );

        for (
            const property of
                SECTION_CUSTOMIZATION_FIELDS
        ) {
            if (
                !hasOwn(
                    customization,
                    property
                )
            ) {
                continue;
            }

            const values =
                getCustomizationValues(
                    resumeCustomization
                        ?.commonSection,
                    property
                );

            if (
                Array.isArray(values) &&
                values.length > 0
            ) {
                errors.push(
                    ...validateEnum(
                        customization[
                            property
                        ],
                        `${field}.${property}`,
                        values
                    )
                );
            } else {
                errors.push(
                    ...validateString(
                        customization[
                            property
                        ],
                        `${field}.${property}`,
                        {
                            required: true,
                            maxLength:
                                getCustomizationStringLimit(),
                        }
                    )
                );
            }
        }

        return errors;
    };

// ============================================================
// Entry Customization
// ============================================================

const ENTRY_CUSTOMIZATION_FIELDS =
    new Set([
        "visibility",
        "alignment",
        "emphasis",
        "spacing",
        "titleStyle",
        "subtitleStyle",
        "dateStyle",
    ]);

const validateEntryCustomization =
    (
        customization,
        field
    ) => {
        const errors = [];

        errors.push(
            ...validateObject(
                customization,
                field
            )
        );

        if (
            !isPlainObject(
                customization
            )
        ) {
            return errors;
        }

        errors.push(
            ...validateAllowedFields(
                customization,
                ENTRY_CUSTOMIZATION_FIELDS,
                field
            )
        );

        for (
            const property of
                ENTRY_CUSTOMIZATION_FIELDS
        ) {
            if (
                !hasOwn(
                    customization,
                    property
                )
            ) {
                continue;
            }

            const values =
                getCustomizationValues(
                    resumeCustomization
                        ?.entry,
                    property
                );

            if (
                Array.isArray(values) &&
                values.length > 0
            ) {
                errors.push(
                    ...validateEnum(
                        customization[
                            property
                        ],
                        `${field}.${property}`,
                        values
                    )
                );
            } else {
                errors.push(
                    ...validateString(
                        customization[
                            property
                        ],
                        `${field}.${property}`,
                        {
                            required: true,
                            maxLength:
                                getCustomizationStringLimit(),
                        }
                    )
                );
            }
        }

        return errors;
    };

// ============================================================
// Generic Section Data
// ============================================================

function validateGenericSectionData(
    data,
    field
) {
    if (
        data === undefined ||
        data === null
    ) {
        return [];
    }

    if (
        !isPlainObject(data)
    ) {
        return [
            createError(
                field,
                `${field} must be an object.`
            ),
        ];
    }

    return [];
}

// ============================================================
// Summary
// ============================================================

function validateSummaryData(
    data,
    field
) {
    const errors = [];

    errors.push(
        ...validateObject(
            data,
            field
        )
    );

    if (
        !isPlainObject(data)
    ) {
        return errors;
    }

    const allowedFields =
        new Set([
            "text",
            "content",
        ]);

    errors.push(
        ...validateAllowedFields(
            data,
            allowedFields,
            field
        )
    );

    for (
        const property of
            allowedFields
    ) {
        if (
            hasOwn(
                data,
                property
            )
        ) {
            errors.push(
                ...validateString(
                    data[property],
                    `${field}.${property}`,
                    {
                        maxLength:
                            limits.resume
                                ?.professionalSummary
                                ?.maxLength ??
                            getEntryLimit(
                                "description"
                            ),
                    }
                )
            );
        }
    }

    return errors;
}

// ============================================================
// Experience
// ============================================================

function validateExperienceData(
    data,
    field
) {
    const errors = [];

    errors.push(
        ...validateObject(
            data,
            field
        )
    );

    if (
        !isPlainObject(data)
    ) {
        return errors;
    }

    const allowedFields =
        new Set([
            "company",
            "position",
            "startDate",
            "endDate",
            "description",
            "isCurrent",
            "location",
            "responsibilities",
        ]);

    errors.push(
        ...validateAllowedFields(
            data,
            allowedFields,
            field
        )
    );

    const shortFields = [
        "company",
        "position",
        "startDate",
        "endDate",
        "location",
    ];

    for (
        const property of shortFields
    ) {
        if (
            hasOwn(
                data,
                property
            )
        ) {
            errors.push(
                ...validateString(
                    data[property],
                    `${field}.${property}`,
                    {
                        maxLength:
                            property ===
                            "company"
                                ? limits.resume
                                      ?.experience
                                      ?.company
                                      ?.maxLength ??
                                  200
                                : property ===
                                  "position"
                                ? limits.resume
                                      ?.experience
                                      ?.position
                                      ?.maxLength ??
                                  200
                                : getEntryLimit(
                                      "date"
                                  ),
                    }
                )
            );
        }
    }

    if (
        hasOwn(
            data,
            "description"
        )
    ) {
        errors.push(
            ...validateString(
                data.description,
                `${field}.description`,
                {
                    maxLength:
                        getEntryLimit(
                            "description"
                        ),
                }
            )
        );
    }

    if (
        hasOwn(
            data,
            "isCurrent"
        )
    ) {
        errors.push(
            ...validateBoolean(
                data.isCurrent,
                `${field}.isCurrent`
            )
        );
    }

    if (
        hasOwn(
            data,
            "responsibilities"
        )
    ) {
        if (
            !Array.isArray(
                data.responsibilities
            )
        ) {
            errors.push(
                createError(
                    `${field}.responsibilities`,
                    `${field}.responsibilities must be an array.`
                )
            );
        } else {
            const maxItems =
                limits.resume
                    ?.experience
                    ?.responsibilities
                    ?.maxItems ??
                50;

            if (
                data.responsibilities
                    .length >
                maxItems
            ) {
                errors.push(
                    createError(
                        `${field}.responsibilities`,
                        `Responsibilities cannot contain more than ${maxItems} items.`
                    )
                );
            }

            data.responsibilities.forEach(
                (
                    responsibility,
                    index
                ) => {
                    errors.push(
                        ...validateString(
                            responsibility,
                            `${field}.responsibilities[${index}]`,
                            {
                                required:
                                    true,
                                maxLength:
                                    limits.resume
                                        ?.experience
                                        ?.responsibilities
                                        ?.itemMaxLength ??
                                    2000,
                            }
                        )
                    );
                }
            );
        }
    }

    return errors;
}

// ============================================================
// Education
// ============================================================

function validateEducationData(
    data,
    field
) {
    const errors = [];

    errors.push(
        ...validateObject(
            data,
            field
        )
    );

    if (
        !isPlainObject(data)
    ) {
        return errors;
    }

    const allowedFields =
        new Set([
            "institution",
            "degree",
            "field",
            "graduationDate",
            "gpa",
            "location",
            "description",
        ]);

    errors.push(
        ...validateAllowedFields(
            data,
            allowedFields,
            field
        )
    );

    const shortFields = [
        "institution",
        "degree",
        "field",
        "graduationDate",
        "gpa",
        "location",
    ];

    for (
        const property of shortFields
    ) {
        if (
            hasOwn(
                data,
                property
            )
        ) {
            errors.push(
                ...validateString(
                    data[property],
                    `${field}.${property}`,
                    {
                        maxLength:
                            limits.resume
                                ?.education?.[
                                property ===
                                "field"
                                    ? "fieldOfStudy"
                                    : property
                            ]?.maxLength ??
                            getEntryLimit(
                                "date"
                            ),
                    }
                )
            );
        }
    }

    if (
        hasOwn(
            data,
            "description"
        )
    ) {
        errors.push(
            ...validateString(
                data.description,
                `${field}.description`,
                {
                    maxLength:
                        getEntryLimit(
                            "description"
                        ),
                }
            )
        );
    }

    return errors;
}

// ============================================================
// Skills
// ============================================================

function validateSkillsData(
    data,
    field
) {
    const errors = [];

    errors.push(
        ...validateObject(
            data,
            field
        )
    );

    if (
        !isPlainObject(data)
    ) {
        return errors;
    }

    const allowedFields =
        new Set([
            "category",
            "skills",
        ]);

    errors.push(
        ...validateAllowedFields(
            data,
            allowedFields,
            field
        )
    );

    if (
        hasOwn(
            data,
            "category"
        )
    ) {
        errors.push(
            ...validateString(
                data.category,
                `${field}.category`,
                {
                    maxLength:
                        limits.resume
                            ?.skills
                            ?.categoryTitle
                            ?.maxLength ??
                        120,
                }
            )
        );
    }

    if (
        hasOwn(
            data,
            "skills"
        )
    ) {
        if (
            !Array.isArray(
                data.skills
            )
        ) {
            errors.push(
                createError(
                    `${field}.skills`,
                    `${field}.skills must be an array.`
                )
            );
        } else {
            const maxSkills =
                limits.resume
                    ?.skills
                    ?.maxSkillsPerCategory ??
                50;

            if (
                data.skills.length >
                maxSkills
            ) {
                errors.push(
                    createError(
                        `${field}.skills`,
                        `A skills category cannot contain more than ${maxSkills} skills.`
                    )
                );
            }

            data.skills.forEach(
                (
                    skill,
                    index
                ) => {
                    errors.push(
                        ...validateString(
                            skill,
                            `${field}.skills[${index}]`,
                            {
                                required:
                                    true,
                                maxLength:
                                    limits.resume
                                        ?.skills
                                        ?.skillName
                                        ?.maxLength ??
                                    100,
                            }
                        )
                    );
                }
            );
        }
    }

    return errors;
}

// ============================================================
// Projects
// ============================================================

function validateProjectsData(
    data,
    field
) {
    const errors = [];

    errors.push(
        ...validateObject(
            data,
            field
        )
    );

    if (
        !isPlainObject(data)
    ) {
        return errors;
    }

    const allowedFields =
        new Set([
            "name",
            "type",
            "description",
            "url",
            "technologies",
        ]);

    errors.push(
        ...validateAllowedFields(
            data,
            allowedFields,
            field
        )
    );

    if (
        hasOwn(data, "name")
    ) {
        errors.push(
            ...validateString(
                data.name,
                `${field}.name`,
                {
                    maxLength:
                        limits.resume
                            ?.entries
                            ?.title
                            ?.maxLength ??
                        200,
                }
            )
        );
    }

    if (
        hasOwn(data, "type")
    ) {
        errors.push(
            ...validateString(
                data.type,
                `${field}.type`,
                {
                    maxLength:
                        limits.resume
                            ?.entries
                            ?.subtitle
                            ?.maxLength ??
                        200,
                }
            )
        );
    }

    if (
        hasOwn(
            data,
            "description"
        )
    ) {
        errors.push(
            ...validateString(
                data.description,
                `${field}.description`,
                {
                    maxLength:
                        getEntryLimit(
                            "description"
                        ),
                }
            )
        );
    }

    if (
        hasOwn(data, "url")
    ) {
        errors.push(
            ...validateString(
                data.url,
                `${field}.url`,
                {
                    maxLength:
                        getEntryLimit(
                            "url"
                        ),
                }
            )
        );
    }

    if (
        hasOwn(
            data,
            "technologies"
        )
    ) {
        if (
            !Array.isArray(
                data.technologies
            )
        ) {
            errors.push(
                createError(
                    `${field}.technologies`,
                    `${field}.technologies must be an array.`
                )
            );
        } else {
            const maxTechnologies =
                limits.resume
                    ?.projects
                    ?.maxTechnologies ??
                50;

            if (
                data.technologies
                    .length >
                maxTechnologies
            ) {
                errors.push(
                    createError(
                        `${field}.technologies`,
                        `A project cannot contain more than ${maxTechnologies} technologies.`
                    )
                );
            }

            data.technologies.forEach(
                (
                    technology,
                    index
                ) => {
                    errors.push(
                        ...validateString(
                            technology,
                            `${field}.technologies[${index}]`,
                            {
                                required:
                                    true,
                                maxLength:
                                    limits.resume
                                        ?.projects
                                        ?.technologyName
                                        ?.maxLength ??
                                    100,
                            }
                        )
                    );
                }
            );
        }
    }

    return errors;
}

// ============================================================
// Custom Section Data
// ============================================================

function validateCustomSectionData(
    data,
    field
) {
    const errors = [];

    if (
        !isPlainObject(data)
    ) {
        return [
            createError(
                field,
                `${field} must be an object.`
            ),
        ];
    }

    const dangerousKeys =
        new Set([
            "__proto__",
            "prototype",
            "constructor",
        ]);

    const keys =
        Object.keys(data);

    const maxFields =
        limits.resume
            ?.customization
            ?.maxCustomPropertiesPerConfiguration ??
        50;

    if (
        keys.length >
        maxFields
    ) {
        errors.push(
            createError(
                field,
                `Custom section data cannot contain more than ${maxFields} fields.`
            )
        );
    }

    const maxTextLength =
        getCustomSectionTextLimit();

    for (
        const key of keys
    ) {
        if (
            dangerousKeys.has(
                key
            )
        ) {
            errors.push(
                createError(
                    `${field}.${key}`,
                    `Field '${key}' is not allowed.`
                )
            );

            continue;
        }

        const value =
            data[key];

        if (
            typeof value ===
            "string"
        ) {
            if (
                value.length >
                maxTextLength
            ) {
                errors.push(
                    createError(
                        `${field}.${key}`,
                        `Custom section text cannot exceed ${maxTextLength} characters.`
                    )
                );
            }

            continue;
        }

        if (
            Array.isArray(value)
        ) {
            const maxItems =
                limits.resume
                    ?.entries
                    ?.maxPerSection ??
                100;

            if (
                value.length >
                maxItems
            ) {
                errors.push(
                    createError(
                        `${field}.${key}`,
                        `Custom section arrays cannot contain more than ${maxItems} items.`
                    )
                );
            }

            for (
                const item of value
            ) {
                if (
                    typeof item !==
                        "string" &&
                    typeof item !==
                        "number" &&
                    typeof item !==
                        "boolean" &&
                    item !== null
                ) {
                    errors.push(
                        createError(
                            `${field}.${key}`,
                            "Custom section arrays may only contain primitive values."
                        )
                    );

                    break;
                }
            }

            continue;
        }

        if (
            value !== null &&
            typeof value !==
                "number" &&
            typeof value !==
                "boolean"
        ) {
            errors.push(
                createError(
                    `${field}.${key}`,
                    "Custom section values must be primitive values or arrays of primitive values."
                )
            );
        }
    }

    return errors;
}

// ============================================================
// Section Data Validators
// ============================================================

const SECTION_DATA_VALIDATORS =
    Object.freeze({
        summary:
            validateSummaryData,

        experience:
            validateExperienceData,

        education:
            validateEducationData,

        skills:
            validateSkillsData,

        projects:
            validateProjectsData,

        certificates:
            validateGenericSectionData,

        courses:
            validateGenericSectionData,

        awards:
            validateGenericSectionData,

        languages:
            validateGenericSectionData,

        interests:
            validateGenericSectionData,

        organisations:
            validateGenericSectionData,

        publications:
            validateGenericSectionData,

        references:
            validateGenericSectionData,

        declaration:
            validateGenericSectionData,

        custom:
            validateCustomSectionData,
    });

// ============================================================
// Entry Validation
// ============================================================

const ENTRY_FIELDS =
    new Set([
        "_id",
        "order",
        "visible",
        "customization",
        "data",
    ]);

const validateEntry = (
    entry,
    sectionType,
    sectionIndex,
    entryIndex
) => {
    const field =
        `sections[${sectionIndex}].entries[${entryIndex}]`;

    const errors = [];

    errors.push(
        ...validateObject(
            entry,
            field
        )
    );

    if (
        !isPlainObject(entry)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            entry,
            ENTRY_FIELDS,
            field
        )
    );

    if (
        hasOwn(
            entry,
            "_id"
        ) &&
        entry._id !== undefined &&
        entry._id !== null
    ) {
        errors.push(
            ...validateObjectId(
                entry._id,
                `${field}._id`
            )
        );
    }

    if (
        hasOwn(
            entry,
            "order"
        )
    ) {
        errors.push(
            ...validateNumber(
                entry.order,
                `${field}.order`,
                {
                    min: 0,
                    max:
                        limits.resume
                            ?.entries
                            ?.maxPerSection ??
                        100,
                    integer: true,
                }
            )
        );
    }

    if (
        hasOwn(
            entry,
            "visible"
        )
    ) {
        errors.push(
            ...validateBoolean(
                entry.visible,
                `${field}.visible`
            )
        );
    }

    if (
        hasOwn(
            entry,
            "customization"
        )
    ) {
        errors.push(
            ...validateEntryCustomization(
                entry.customization,
                `${field}.customization`
            )
        );
    }

    if (
        hasOwn(
            entry,
            "data"
        )
    ) {
        const validator =
            SECTION_DATA_VALIDATORS[
                sectionType
            ] ||
            validateGenericSectionData;

        errors.push(
            ...validator(
                entry.data,
                `${field}.data`
            )
        );
    }

    return errors;
};

// ============================================================
// Section Validation
// ============================================================

const SECTION_FIELDS =
    new Set([
        "_id",
        "type",
        "title",
        "order",
        "visible",
        "customization",
        "entries",
    ]);

const validateSection = (
    section,
    sectionIndex
) => {
    const field =
        `sections[${sectionIndex}]`;

    const errors = [];

    errors.push(
        ...validateObject(
            section,
            field
        )
    );

    if (
        !isPlainObject(section)
    ) {
        return errors;
    }

    errors.push(
        ...validateAllowedFields(
            section,
            SECTION_FIELDS,
            field
        )
    );

    if (
        hasOwn(
            section,
            "_id"
        ) &&
        section._id !== undefined &&
        section._id !== null
    ) {
        errors.push(
            ...validateObjectId(
                section._id,
                `${field}._id`
            )
        );
    }

    if (
        !hasOwn(
            section,
            "type"
        )
    ) {
        errors.push(
            createError(
                `${field}.type`,
                "Section type is required."
            )
        );
    } else {
        errors.push(
            ...validateString(
                section.type,
                `${field}.type`,
                {
                    required: true,
                    maxLength:
                        getSectionTypeLimit(),
                }
            )
        );

        if (
            typeof section.type ===
                "string" &&
            Array.isArray(
                resumeSections?.all
            ) &&
            !resumeSections.all.includes(
                section.type
            )
        ) {
            errors.push(
                createError(
                    `${field}.type`,
                    `Unsupported resume section type '${section.type}'.`
                )
            );
        }
    }

    if (
        hasOwn(
            section,
            "title"
        )
    ) {
        errors.push(
            ...validateString(
                section.title,
                `${field}.title`,
                {
                    required: true,
                    minLength:
                        limits.resume
                            ?.sections
                            ?.title
                            ?.minLength ??
                        1,
                    maxLength:
                        getSectionTitleLimit(),
                }
            )
        );
    }

    if (
        hasOwn(
            section,
            "order"
        )
    ) {
        errors.push(
            ...validateNumber(
                section.order,
                `${field}.order`,
                {
                    min: 0,
                    max:
                        limits.resume
                            ?.sections
                            ?.maxCount ??
                        30,
                    integer: true,
                }
            )
        );
    }

    if (
        hasOwn(
            section,
            "visible"
        )
    ) {
        errors.push(
            ...validateBoolean(
                section.visible,
                `${field}.visible`
            )
        );
    }

    if (
        hasOwn(
            section,
            "customization"
        )
    ) {
        errors.push(
            ...validateSectionCustomization(
                section.customization,
                `${field}.customization`
            )
        );
    }

    if (
        hasOwn(
            section,
            "entries"
        )
    ) {
        if (
            !Array.isArray(
                section.entries
            )
        ) {
            errors.push(
                createError(
                    `${field}.entries`,
                    `${field}.entries must be an array.`
                )
            );
        } else {
            const maxEntries =
                limits.resume
                    ?.entries
                    ?.maxPerSection ??
                100;

            if (
                section.entries.length >
                maxEntries
            ) {
                errors.push(
                    createError(
                        `${field}.entries`,
                        `A section cannot contain more than ${maxEntries} entries.`
                    )
                );
            }

            const entryOrders =
                new Set();

            section.entries.forEach(
                (
                    entry,
                    entryIndex
                ) => {
                    errors.push(
                        ...validateEntry(
                            entry,
                            section.type,
                            sectionIndex,
                            entryIndex
                        )
                    );

                    if (
                        Number.isInteger(
                            entry?.order
                        )
                    ) {
                        if (
                            entryOrders.has(
                                entry.order
                            )
                        ) {
                            errors.push(
                                createError(
                                    `${field}.entries`,
                                    "Entry order values must be unique within a section."
                                )
                            );
                        }

                        entryOrders.add(
                            entry.order
                        );
                    }
                }
            );
        }
    }

    return errors;
};

// ============================================================
// Complete Resume Validation
// ============================================================

const RESUME_FIELDS =
    new Set([
        "_id",
        "userId",
        "title",
        "public",
        "personalInfo",
        "design",
        "document",
        "sections",
    ]);

const validateResume = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(payload)
    ) {
        return createResult([
            createError(
                "body",
                "Resume payload must be a valid object."
            ),
        ]);
    }

    errors.push(
        ...validateAllowedFields(
            payload,
            RESUME_FIELDS,
            "resume"
        )
    );

    if (
        hasOwn(
            payload,
            "_id"
        ) &&
        payload._id !== undefined &&
        payload._id !== null
    ) {
        errors.push(
            ...validateObjectId(
                payload._id,
                "_id"
            )
        );
    }

    /*
     * userId may only be used internally.
     * HTTP controllers must take ownership from the
     * authenticated user rather than request data.
     */
    if (
        hasOwn(
            payload,
            "userId"
        )
    ) {
        errors.push(
            ...validateObjectId(
                payload.userId,
                "userId"
            )
        );
    }

    if (
        hasOwn(
            payload,
            "title"
        )
    ) {
        errors.push(
            ...validateString(
                payload.title,
                "title",
                {
                    required: true,
                    minLength:
                        limits.resume
                            ?.title
                            ?.minLength ??
                        1,
                    maxLength:
                        limits.resume
                            ?.title
                            ?.maxLength ??
                        120,
                }
            )
        );
    }

    if (
        hasOwn(
            payload,
            "public"
        )
    ) {
        errors.push(
            ...validateBoolean(
                payload.public,
                "public"
            )
        );
    }

    if (
        hasOwn(
            payload,
            "personalInfo"
        )
    ) {
        errors.push(
            ...validatePersonalInfo(
                payload.personalInfo
            )
        );
    }

    if (
        hasOwn(
            payload,
            "document"
        )
    ) {
        errors.push(
            ...validateDocument(
                payload.document
            )
        );
    }

    if (
        hasOwn(
            payload,
            "design"
        )
    ) {
        errors.push(
            ...validateDesign(
                payload.design
            )
        );
    }

    if (
        hasOwn(
            payload,
            "sections"
        )
    ) {
        if (
            !Array.isArray(
                payload.sections
            )
        ) {
            errors.push(
                createError(
                    "sections",
                    "sections must be an array."
                )
            );
        } else {
            const maxSections =
                limits.resume
                    ?.sections
                    ?.maxCount ??
                30;

            if (
                payload.sections.length >
                maxSections
            ) {
                errors.push(
                    createError(
                        "sections",
                        `A resume cannot contain more than ${maxSections} sections.`
                    )
                );
            }

            const sectionOrders =
                new Set();

            payload.sections.forEach(
                (
                    section,
                    sectionIndex
                ) => {
                    errors.push(
                        ...validateSection(
                            section,
                            sectionIndex
                        )
                    );

                    if (
                        Number.isInteger(
                            section?.order
                        )
                    ) {
                        if (
                            sectionOrders.has(
                                section.order
                            )
                        ) {
                            errors.push(
                                createError(
                                    "sections",
                                    "Section order values must be unique."
                                )
                            );
                        }

                        sectionOrders.add(
                            section.order
                        );
                    }
                }
            );
        }
    }

    return createResult(
        errors
    );
};

// ============================================================
// Create Validation
// ============================================================

const validateCreateResume = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(payload)
    ) {
        return createResult([
            createError(
                "body",
                "Resume payload must be a valid object."
            ),
        ]);
    }

    if (
        hasOwn(
            payload,
            "userId"
        )
    ) {
        errors.push(
            createError(
                "userId",
                "userId must not be supplied by the client."
            )
        );
    }

    const validation =
        validateResume(
            payload
        );

    errors.push(
        ...validation.errors.filter(
            (error) =>
                error.field !==
                "resume.userId"
        )
    );

    return createResult(
        errors
    );
};

// ============================================================
// Update Validation
// ============================================================

const UPDATE_FIELDS =
    new Set([
        "title",
        "public",
        "personalInfo",
        "design",
        "sections",
    ]);

const validateUpdateResume = (
    payload
) => {
    if (
        !isPlainObject(payload)
    ) {
        return createResult([
            createError(
                "body",
                "Resume update payload must be a valid object."
            ),
        ]);
    }

    const errors =
        validateAllowedFields(
            payload,
            UPDATE_FIELDS,
            "resume"
        );

    const validation =
        validateResume(
            payload
        );

    errors.push(
        ...validation.errors.filter(
            (error) =>
                error.field !==
                "resume.userId"
        )
    );

    return createResult(
        errors
    );
};

// ============================================================
// Section / Entry Operation Validation
// ============================================================

const validateSectionId = (
    sectionId
) =>
    validateObjectId(
        sectionId,
        "sectionId"
    );

const validateEntryId = (
    entryId
) =>
    validateObjectId(
        entryId,
        "entryId"
    );

const validateSectionType = (
    type
) => {
    const errors =
        validateString(
            type,
            "type",
            {
                required: true,
                maxLength:
                    getSectionTypeLimit(),
            }
        );

    if (
        errors.length === 0 &&
        Array.isArray(
            resumeSections?.all
        ) &&
        !resumeSections.all.includes(
            type
        )
    ) {
        errors.push(
            createError(
                "type",
                `Unsupported resume section type '${type}'.`
            )
        );
    }

    return errors;
};

const validateOrder = (
    order
) =>
    validateNumber(
        order,
        "order",
        {
            min: 0,
            max:
                limits.resume
                    ?.sections
                    ?.maxCount ??
                30,
            integer: true,
        }
    );

// ============================================================
// Normalization
// ============================================================

const normalizePersonalInfo = (
    personalInfo
) => {
    if (
        !isPlainObject(
            personalInfo
        )
    ) {
        return personalInfo;
    }

    const normalized = {};

    for (
        const key of Object.keys(
            personalInfo
        )
    ) {
        const value =
            personalInfo[key];

        normalized[key] =
            typeof value ===
            "string"
                ? normalizeString(
                      value
                  )
                : value;
    }

    if (
        typeof normalized.email ===
        "string"
    ) {
        normalized.email =
            normalized.email
                .toLowerCase();
    }

    return normalized;
};

const normalizeEntryData = (
    data
) => {
    if (
        !isPlainObject(data)
    ) {
        return data;
    }

    const normalized = {};

    for (
        const key of Object.keys(
            data
        )
    ) {
        const value =
            data[key];

        if (
            typeof value ===
            "string"
        ) {
            normalized[key] =
                normalizeString(
                    value
                );
        } else if (
            Array.isArray(value)
        ) {
            normalized[key] =
                value.map(
                    (item) =>
                        typeof item ===
                        "string"
                            ? normalizeString(
                                  item
                              )
                            : item
                );
        } else {
            normalized[key] =
                value;
        }
    }

    return normalized;
};

const normalizeResumeData = (
    payload
) => {
    if (
        !isPlainObject(payload)
    ) {
        return payload;
    }

    const normalized = {
        ...payload,
    };

    if (
        typeof normalized.title ===
        "string"
    ) {
        normalized.title =
            normalizeString(
                normalized.title
            );
    }

    if (
        normalized.personalInfo
    ) {
        normalized.personalInfo =
            normalizePersonalInfo(
                normalized.personalInfo
            );
    }

    if (
        Array.isArray(
            normalized.sections
        )
    ) {
        normalized.sections =
            normalized.sections.map(
                (section) => ({
                    ...section,

                    title:
                        typeof section.title ===
                        "string"
                            ? normalizeString(
                                  section.title
                              )
                            : section.title,

                    entries:
                        Array.isArray(
                            section.entries
                        )
                            ? section.entries.map(
                                  (
                                      entry
                                  ) => ({
                                      ...entry,

                                      data:
                                          normalizeEntryData(
                                              entry.data
                                          ),
                                  })
                              )
                            : section.entries,
                })
            );
    }

    return normalized;
};

// ============================================================
// Export
// ============================================================

const resumeValidator =
    Object.freeze({
        validateResume,

        validateCreateResume,

        validateUpdateResume,

        validateSectionId,

        validateEntryId,

        validateSectionType,

        validateOrder,

        normalizeResumeData,
    });

export default resumeValidator;