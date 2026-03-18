import { BadgeCheck, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function Toast({
  position,
  message = "Autosaved successfully",
  duration = 3000,
  onClose,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <>
      {/* Inline animation – no tailwind config needed */}
      <style>
        {`
          @keyframes slideDownFade {
            from {
              opacity: 0;
              transform: translateY(-12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        className={`fixed ${position==="top"?"top-35":"top-6"} right-6 z-50`}
        style={{ animation: "slideDownFade 0.3s ease-out"}}
      >
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-md border border-gray-200">
          
          {/* subtle status dot */}
          <BadgeCheck className="text-green-600"/>

          {/* message */}
          <p className="text-sm font-medium text-green-600">
            {message}
          </p>
        </div>
      </div>
    </>
  );
}
