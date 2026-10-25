import type { SVGProps } from "react";

/**
 * Chunky 2.4px round-cap icons, drawn to sit next to the 2px ink line.
 * Decorative by default (aria-hidden): the label next to them carries the meaning.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
            {...props}
        >
            {children}
        </svg>
    );
}

type IconProps = SVGProps<SVGSVGElement>;

/** Board: a little signpost on a hill. */
export const BoardIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 21V9" />
        <path d="M5 5h11l3 3-3 3H5z" />
        <path d="M7 21h10" />
    </Icon>
);

export const CalendarIcon = (p: IconProps) => (
    <Icon {...p}>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 10h16M9 3v4M15 3v4" />
    </Icon>
);

export const BackpackIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M8 6a4 4 0 0 1 8 0" />
        <rect x="5" y="6" width="14" height="15" rx="4" />
        <path d="M9 14h6" />
    </Icon>
);

export const CheckIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
);

export const CloseIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
);

export const EditIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" />
        <path d="M14.5 6.5l3 3" />
    </Icon>
);

export const TrashIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
    </Icon>
);

export const ClockIcon = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
    </Icon>
);

export const AlertIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 4l9 16H3z" />
        <path d="M12 10v4M12 17.2v.1" />
    </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d="M6 9.5l6 6 6-6" />
    </Icon>
);
