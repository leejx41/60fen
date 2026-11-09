interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

export function Icon({
  name,
  size = 22,
  filled = false,
  className,
}: IconProps): JSX.Element {
  return (
    <span
      className={`icon${filled ? " icon--filled" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
