import { useEffect, useRef } from "react";

export default function NumberedTextarea({
  isGen,
  value,
  onChange,
  placeholder,
  prefix = "",
  inputRef,
  autoNumber = true,
}) {
  const ref = useRef(null);
  const initializedRef = useRef(false);

  const DEFAULT_POINTS = `1. 
2. 
3. 
4. `;

  // Initialize only once
  useEffect(() => {
    if (initializedRef.current) return;

    if (!value || value.trim() === "") {
      // For fields where automatic numbering is disabled,
      // start with an empty textarea.
      if (!autoNumber) {
        onChange(prefix ? prefix.trimEnd() + "\n" : "");
      } else {
        const initialValue = prefix
          ? prefix.trimEnd() + "\n" + DEFAULT_POINTS
          : DEFAULT_POINTS;

        onChange(initialValue);
      }
    }

    initializedRef.current = true;
  }, [value, prefix, autoNumber, onChange]);

  const handleChange = (e) => {
    const text = e.target.value;

    // Protect prefix without wiping content
    if (prefix && !text.startsWith(prefix)) {
      return;
    }

    onChange(text);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    // If automatic numbering is disabled,
    // allow normal Enter behavior.
    if (!autoNumber) return;

    e.preventDefault();

    const lines = value.split("\n");

    let lastNumber = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\d+)\.\s*/);

      if (match) {
        lastNumber = parseInt(match[1], 10);
        break;
      }
    }

    const nextNumber = lastNumber + 1;

    const newValue =
      value.trimEnd() + `\n${nextNumber}. `;

    onChange(newValue);

    setTimeout(() => {
      const textarea = inputRef?.current || ref.current;

      if (textarea) {
        textarea.selectionStart = newValue.length;
        textarea.selectionEnd = newValue.length;
      }
    }, 0);
  };

  return (
    <textarea
      ref={inputRef || ref}
      value={value}
      placeholder={placeholder}
      readOnly={isGen}
      onChange={(e) =>
        isGen
          ? alert(
              "To edit Document please click Edit & Regenerate Button"
            )
          : handleChange(e)
      }
      onKeyDown={(e) =>
        isGen
          ? alert(
              "To edit Document please click Edit & Regenerate Button"
            )
          : handleKeyDown(e)
      }
      rows={6}
      className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                 resize-none focus:ring-2 focus:ring-slate-400 outline-none"
    />
  );
}