import { CheckIcon, CircleBackslashIcon, Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";
import { Grid } from "./grid.js";
import { Marker } from "./marker.js";
import { Skeleton } from "./skeleton.js";
import { Text } from "./text.js";

interface FlagProps {
  state: "enabled" | "error" | "warning" | "disabled";
  label: string;
  loading?: boolean;
}

export const Flag: React.FC<FlagProps> = ({ label, loading = false, state }) => {
  let color: "gray" | "green" | "red" | "yellow" = "gray";
  if (state === "enabled") {
    color = "green";
  } else if (state === "error") {
    color = "red";
  } else if (state === "warning") {
    color = "yellow";
  } else if (state === "disabled") {
    color = "gray";
  }

  let icon: React.ReactNode;
  if (state === "enabled") {
    icon = <CheckIcon height="16" width="16" />;
  } else if (state === "error") {
    icon = <Cross2Icon height="16" width="16" />;
  } else if (state === "warning") {
    icon = <ExclamationIcon height="16" width="16" />;
  } else if (state === "disabled") {
    icon = <CircleBackslashIcon color={color} height="16" width="16" />;
  }

  if (state === "enabled" || state === "error" || state === "warning") {
    return (
      <Skeleton loading={loading}>
        <Grid align="center" columns="14px auto" display="inline-grid" gap="2">
          <Marker color={color} size="2">
            {icon}
          </Marker>
          <Text className="whitespace-nowrap" color={color} size="2">
            {label}
          </Text>
        </Grid>
      </Skeleton>
    );
  } else if (state === "disabled") {
    return (
      <Skeleton loading={loading}>
        <Grid align="center" columns="14px auto" display="inline-grid" gap="2">
          {icon}
          <Text className="whitespace-nowrap" color={color} size="2">
            {label}
          </Text>
        </Grid>
      </Skeleton>
    );
  }

  return null;
};

export default Flag;

const ExclamationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    fill="none"
    height="15"
    viewBox="0 0 15 15"
    width="15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.49971 10.7503C7.91393 10.7503 8.24971 11.086 8.24971 11.5003C8.24955 11.9143 7.91383 12.2503 7.49971 12.2503C7.08572 12.2501 6.74987 11.9142 6.74971 11.5003C6.74971 11.0861 7.08563 10.7504 7.49971 10.7503ZM7.48311 2.25029C8.00061 2.25054 8.41411 2.68038 8.39424 3.19756L8.20577 8.80498C8.19119 9.18285 7.8808 9.48168 7.50264 9.48174C7.12444 9.48174 6.81409 9.18288 6.79952 8.80498L6.571 3.19756C6.55111 2.68023 6.9654 2.25029 7.48311 2.25029Z"
      fill="currentColor"
    />
  </svg>
);
