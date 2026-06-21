import { formatDistanceToNow, format } from "date-fns";
import { cn } from "../../lib/utils";

interface TimestampProps {
  date: string | Date;
  className?: string;
  relativeClassName?: string;
  fullClassName?: string;
  showFull?: boolean;
}

export function Timestamp({ date, className, relativeClassName, fullClassName, showFull = true }: TimestampProps) {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Custom relative format logic to match "Just now" for less than 1 minute if needed, 
  // but date-fns formatDistanceToNow(..., { addSuffix: true }) usually outputs "less than a minute ago". 
  // Let's replace "less than a minute ago" with "Just now".
  let relativeTime = formatDistanceToNow(dateObj, { addSuffix: true });
  if (relativeTime === "less than a minute ago" || relativeTime === "in less than a minute" || relativeTime === "half a minute ago") {
    relativeTime = "Just now";
  } else if (relativeTime === "1 day ago" || relativeTime === "about 1 day ago") {
    relativeTime = "Yesterday";
  } else {
    // Standardize "about X hours ago" to "X hours ago" if needed
    relativeTime = relativeTime.replace("about ", "");
  }

  // Full format: e.g. Oct 24, 2023, 2:30 PM
  const fullFormat = format(dateObj, "MMM d, yyyy, h:mm a");

  return (
    <div className={cn("flex flex-col", className)} title={fullFormat}>
      <span className={cn("text-xs font-medium text-foreground", relativeClassName)}>
        {relativeTime}
      </span>
      {showFull && (
        <span className={cn("text-[10px] text-muted-foreground", fullClassName)}>
          {fullFormat}
        </span>
      )}
    </div>
  );
}
