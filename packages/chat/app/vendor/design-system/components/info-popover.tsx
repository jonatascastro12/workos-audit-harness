import { InfoCircledIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Box } from "./box.js";
import { IconButton } from "./icon-button.js";
import { Popover } from "./popover.js";
import { Text } from "./text.js";

export interface InfoPopoverProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  label?: string;
}

export const InfoPopover: React.FC<Readonly<InfoPopoverProps>> = ({
  content,
  children = <InfoCircledIcon color="gray" height={16} width={16} />,
  label = "Learn more",
}) => (
  <Popover.Root>
    <Box display="inline" ml="1" style={{ verticalAlign: "sub" }}>
      <Popover.Trigger aria-label={label}>
        <IconButton size="1">{children}</IconButton>
      </Popover.Trigger>
    </Box>

    <Popover.Content size="1" width="400px">
      <Text size="2" trim="both">
        {content}
      </Text>
    </Popover.Content>
  </Popover.Root>
);
