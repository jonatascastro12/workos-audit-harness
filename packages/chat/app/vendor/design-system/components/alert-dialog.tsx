"use client";
import { ExclamationCircledIcon } from "@radix-ui/react-icons";
import * as ThemesAlertDialog from "@radix-ui/themes/dist/esm/components/alert-dialog.js";
import type { MarginProps } from "@radix-ui/themes/dist/esm/props/margin.props.js";
import * as React from "react";
import { Box, Callout, Flex, isReactFragment } from "../index.js";

const MAX_WIDTH_MAPPING = {
  "1": "430px",
  "2": "530px",
} as const;

type ThemesAlertDialogContentProps = React.ComponentPropsWithoutRef<
  typeof ThemesAlertDialog.Content
>;
interface AlertDialogContentProps extends Omit<ThemesAlertDialogContentProps, "size"> {
  size?: keyof typeof MAX_WIDTH_MAPPING;
}

const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof ThemesAlertDialog.Content>,
  AlertDialogContentProps
>(({ size = "1", ...props }, forwardedRef) => {
  const maxWidth = MAX_WIDTH_MAPPING[size];

  return (
    <ThemesAlertDialog.Content
      ref={forwardedRef}
      maxWidth={maxWidth}
      onOpenAutoFocus={(event) => {
        /**
         * Focus the first input in the dialog when the alert dialog is opened
         * By default radix will focus the `cancel` button
         */
        if (event.currentTarget instanceof HTMLElement) {
          const firstInput = event.currentTarget.querySelector("input");
          if (firstInput instanceof HTMLInputElement) {
            event.preventDefault();
            firstInput.focus();
          }
        }
      }}
      {...props}
    />
  );
});

AlertDialogContent.displayName = "AlertDialog.Content";

type AlertDialogTitleProps = React.ComponentPropsWithoutRef<typeof ThemesAlertDialog.Title>;

const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof ThemesAlertDialog.Title>,
  AlertDialogTitleProps
>((props, forwardedRef) => <ThemesAlertDialog.Title ref={forwardedRef} size="4" {...props} />);

AlertDialogTitle.displayName = "AlertDialog.Title";

type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof ThemesAlertDialog.Description
>;

const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof ThemesAlertDialog.Description>,
  AlertDialogDescriptionProps
>((props, forwardedRef) => (
  <ThemesAlertDialog.Description ref={forwardedRef} size="2" {...props} />
));

AlertDialogDescription.displayName = "AlertDialog.Description";

interface AlertDialogBodyProps extends MarginProps {
  children: React.ReactNode;
}

const AlertDialogBody = React.forwardRef<React.ComponentRef<typeof Box>, AlertDialogBodyProps>(
  ({ children, ...props }, forwardedRef) => (
    <Box ref={forwardedRef} {...props} className="AlertDialogBody">
      {children}
    </Box>
  ),
);

AlertDialogBody.displayName = "AlertDialog.Body";

interface AlertDialogFooterProps extends MarginProps {
  children: React.ReactNode;
}

const AlertDialogFooter = React.forwardRef<React.ComponentRef<typeof Flex>, AlertDialogFooterProps>(
  ({ children, ...props }, forwardedRef) => (
    <Flex
      ref={forwardedRef}
      {...props}
      align="center"
      className="AlertDialogFooter"
      gap="3"
      justify="end"
    >
      {children}
    </Flex>
  ),
);

AlertDialogFooter.displayName = "AlertDialog.Footer";

interface AlertDialogHeaderProps extends React.PropsWithChildren {
  title: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
}

const AlertDialogHeader = React.forwardRef<React.ComponentRef<"div">, AlertDialogHeaderProps>(
  ({ children, title, description, error, ...props }, forwardedRef) => (
    <Flex ref={forwardedRef} className="AlertDialogHeader" direction="column" gap="5" {...props}>
      <ThemesAlertDialog.Title mb="0" size="4" trim="start">
        {title}
      </ThemesAlertDialog.Title>
      {(() => {
        if (!description) {
          return null;
        }

        if (typeof description === "string" || isReactFragment(description)) {
          return <AlertDialogDescription mt="-3">{description}</AlertDialogDescription>;
        }

        return (
          <Flex direction="column" gap="4" mt="-1">
            {description}
          </Flex>
        );
      })()}
      {error && (
        <Callout.Root color="red">
          <Callout.Icon>
            <ExclamationCircledIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {children}
    </Flex>
  ),
);

AlertDialogHeader.displayName = "AlertDialog.Header";

export const Root = ThemesAlertDialog.Root;
export const Trigger = ThemesAlertDialog.Trigger;
export const Content = AlertDialogContent;
export const Title = AlertDialogTitle;
export const Description = AlertDialogDescription;
export const Body = AlertDialogBody;
export const Header = AlertDialogHeader;
export const Footer = AlertDialogFooter;
export const Action = ThemesAlertDialog.Action;
export const Cancel = ThemesAlertDialog.Cancel;
