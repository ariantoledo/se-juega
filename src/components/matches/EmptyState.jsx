import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 text-center"
      aria-label={`Estado vacío: ${title}`}
    >
      {Icon && (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          {typeof Icon === "string" ? (
            <img src={Icon} alt="" className="w-7 h-7 object-contain" />
          ) : (
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
          )}
        </div>
      )}
      <h3 className="font-semibold text-foreground text-base sm:text-lg">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}