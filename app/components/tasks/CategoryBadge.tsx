import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { cx } from "@/app/components/ui/cx";

interface CategoryBadgeProps {
    /** User-chosen colour from the database (hex). The only place a raw colour is allowed. */
    color: string;
    /** lucide icon name chosen by the user. */
    icon?: string;
    /** xs = inside a Pill (same height as the pill's other 14px icons), sm = lists, md = default. */
    size?: "xs" | "sm" | "md";
    className?: string;
}

const BOX = { xs: "size-4", sm: "size-6", md: "size-8" } as const;
const ICON_PX = { xs: 10, sm: 13, md: 16 } as const;

/** Round colour badge with the category icon. Colour is decoration: the category name is always written next to it. */
export function CategoryBadge({ color, icon, size = "md", className }: CategoryBadgeProps) {
    const box = BOX[size];
    return (
        <span
            aria-hidden="true"
            style={{ background: color }}
            className={cx("line grid shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-ink", box, className)}
        >
            {icon && <DynamicIcon name={icon as IconName} size={ICON_PX[size]} strokeWidth={2.4} />}
        </span>
    );
}
