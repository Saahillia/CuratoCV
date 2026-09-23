import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Maps URL paths to display names for breadcrumb items.
 */
const routeNames = {
  app: "Resume Builder",
  resumes: "Resumes",
  edit: "Edit",
  billing: "Billing",
  profile: "Profile",
  pricing: "Pricing",
  checkout: "Checkout",
  products: "All Products",
  notes: "Notes Workspace",
  "resume-builder": "Resume Builder",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const breadcrumbItems = [
    { label: "Home", to: "/" },
  ];

  // If in a product workspace (like app or notes), insert "Products" into logical hierarchy
  if (pathnames[0] === "app" || pathnames[0] === "notes") {
    breadcrumbItems.push({ label: "All Products", to: "/products" });
  }

  let currentPath = "";
  pathnames.forEach((value) => {
    currentPath += `/${value}`;
    const isId = value.length >= 20; // Heuristic for Mongo Object IDs
    const label = routeNames[value] || (isId ? `Detail (${value.substring(0, 4)}...)` : value.charAt(0).toUpperCase() + value.slice(1));

    breadcrumbItems.push({ label, to: currentPath });
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-slate-500">
        {breadcrumbItems.map((item, index) => {
          const last = index === breadcrumbItems.length - 1;

          return (
            <li key={item.to + index} className="flex items-center">
              {index > 0 && <ChevronRight className="size-4 mx-1 text-slate-400" />}
              {last ? (
                <span className="font-semibold text-[#17375F]">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-[#17375F] transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
