/**
 * Developer context for backend/Tests/__mocks__/imagekit.js.
 * Purpose: documents the test scenarios for imagekit.
 * Why separate: keep expected behavior and regression checks close to the tested contract; production behavior stays in its owning module.
 */
import { vi } from "vitest";

/**
 * Mock ImageKit client for testing.
 */
const mockImageKit = {
    upload: vi.fn().mockResolvedValue({
        fileId: "file_mock123",
        name: "test-image.jpg",
        url: "https://ik.imagekit.io/curatocv/test-image.jpg",
        thumbnailUrl: "https://ik.imagekit.io/curatocv/tr:n-thumbnail/test-image.jpg",
        fileType: "image",
    }),
    deleteFile: vi.fn().mockResolvedValue({
        message: "File deleted successfully",
    }),
    getFileDetails: vi.fn().mockResolvedValue({
        fileId: "file_mock123",
        name: "test-image.jpg",
        url: "https://ik.imagekit.io/curatocv/test-image.jpg",
    }),
};

export default vi.fn(() => mockImageKit);
