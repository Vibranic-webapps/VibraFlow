import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { cx } from "@/app/components/ui/cx";

interface CategoryBadgeProps {
    /** User-chosen colour from the database (hex). The only place a raw colour is allowed. */
    color: string;
    /** lucide icon name chosen by the user. */
    icon?: string;
    size?: "sm" | "md";
    className?: string;
}

/** Round colour badge with the category icon. Colour is decoration: the category name is always written next to it. */
export function CategoryBadge({ color, icon, size = "md", className }: CategoryBadgeProps) {
    const box = size === "sm" ? "size-6" : "size-8";
    return (
        <span
            aria-hidden="true"
            style={{ background: color }}
            className={cx("line grid shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-ink", box, className)}
        >
            {icon && <DynamicIcon name={icon as IconName} size={size === "sm" ? 13 : 16} strokeWidth={2.4} />}
        </span>
    );
}
