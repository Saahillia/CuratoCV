import { Check, Palette, Pipette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ColorPicker = ({ selectedColor, onChange }) => {
  const colors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Purple", value: "#9333EA" },
    { name: "Green", value: "#16A34A" },
    { name: "Red", value: "#DC2626" },
    { name: "Orange", value: "#EA580C" },
    { name: "Teal", value: "#0D9488" },
    { name: "Pink", value: "#DB2777" },
    { name: "Gray", value: "#4B5563" },
    { name: "Black", value: "#111827" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomColor = (e) => {
    onChange(e.target.value);
  };

  return (
    <div ref={pickerRef} className="relative">
      {/* Accent Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 ring-purple-300 hover:ring transition-all px-3 py-2 rounded-lg"
      >
        <Palette size={16} />
        <span className="max-sm:hidden">Accent</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-20 w-72 p-4 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg">
          {/* Fixed Accent Colors */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Accent Colors
            </p>

            <div className="grid grid-cols-5 gap-3">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color.name}
                  onClick={() => {
                    onChange(color.value);
                    setIsOpen(false);
                  }}
                  className="relative flex flex-col items-center gap-1 group"
                  title={color.name}
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 border-transparent group-hover:border-gray-400 transition-all"
                    style={{
                      backgroundColor: color.value,
                    }}
                  >
                    {selectedColor === color.value && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4" />

          {/* Global Color Picker */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Custom Color
            </p>

            <div className="flex items-center gap-3">
              {/* Current Color */}
              <div
                className="w-10 h-10 rounded-lg border border-gray-300 shadow-sm"
                style={{
                  backgroundColor: selectedColor || "#3B82F6",
                }}
              />

              {/* Color Picker */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
              >
                <Pipette size={16} />
                Choose Any Color
              </button>

              <input
                ref={colorInputRef}
                type="color"
                value={selectedColor || "#3B82F6"}
                onChange={handleCustomColor}
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
              />
            </div>

            {/* Hex Value */}
            <div className="mt-3">
              <p className="text-xs text-gray-500">Selected color</p>

              <p className="text-sm font-mono text-gray-700 mt-1">
                {selectedColor || "#3B82F6"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
