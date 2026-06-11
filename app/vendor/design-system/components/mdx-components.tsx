import {
  CheckIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { isReactElement } from "../helpers/is-react-element.js";
import * as Accordion from "./accordion.js";
import * as Avatar from "./avatar.js";
import { Badge } from "./badge.js";
import { Box } from "./box.js";
import { Callout } from "./callout.js";
import { Checkbox } from "./checkbox.js";
import { Code } from "./code.js";
import * as CodeBlock from "./code-block.js";
import * as Combobox from "./combobox.js";
import * as DefinitionList from "./definition-list.js";
import { Em } from "./em.js";
import { Flex } from "./flex.js";
import { Heading } from "./heading.js";
import { Image } from "./image.js";
import { Link } from "./link.js";
import { Marker } from "./marker.js";
import { PermanentLink } from "./permanent-link.js";
import * as QuickNav from "./quick-nav.js";
import { RadioGroup } from "./radio-group.js";
import * as Screenshot from "./screenshot.js";
import { Separator } from "./separator.js";
import { TabNav } from "./tab-nav.js";
import * as Table from "./table.js";
import * as Tabs from "./tabs.js";
import { Text } from "./text.js";
import { Zoomable } from "./zoomable.js";

interface MdxComponents {
  [key: string]: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentType<React.PropsWithChildren<any>> | MdxComponents;
}

const mdxComponents: MdxComponents = {
  a: Link,
  code: (props) => <Code highContrast color="gray" {...props} />,
  em: Em,
  h1: (props) => <Heading as="h1" mb="4" mt="0" size="7" {...props} />,
  h2: (props) => <Heading as="h2" mb="3" mt="7" size="5" {...props} />,
  h3: (props) => <Heading as="h3" mb="2" mt="7" size="3" {...props} />,
  h4: (props) => <Heading as="h4" mb="2" mt="7" size="3" {...props} />,
  h5: (props) => <Heading as="h5" mb="2" mt="7" size="3" {...props} />,
  h6: (props) => <Heading as="h6" mb="2" mt="7" size="3" {...props} />,
  hr: (props) => <Separator decorative my="7" size="4" {...props} />,
  img: (props) => (
    <Box my="6">
      <Image {...props} />
    </Box>
  ),
  li: ({ children, ...props }) => (
    <Text mb="2" size="3" {...props} asChild>
      <li>{children}</li>
    </Text>
  ),
  ol: (props) => (
    <Box asChild mb="5" pl="5">
      <ol {...props} />
    </Box>
  ),
  ul: (props) => (
    <Box asChild mb="5" pl="5">
      <ul {...props} />
    </Box>
  ),
  p: (props) => <Text as="p" mb="4" size="3" {...props} />,
  table: (props) => (
    <Table.Root my="5">
      <Table.Content {...props} />
    </Table.Root>
  ),
  thead: Table.Header,
  tbody: Table.Body,
  th: (props: React.PropsWithChildren<{ scope?: string }>) => {
    if (props.scope === "row") {
      return <Table.RowHeader {...props} />;
    }

    return <Table.ColumnHeader {...props} />;
  },
  tr: Table.Row,
  td: (props) => {
    // Instead of rendering dashes or empty string, render a separator instead
    const cellText = getTextFromReactElement(props.children).trim();
    if (["–", "-", "—", ""].includes(cellText)) {
      return (
        <Table.Cell style={{ verticalAlign: "middle" }}>
          <Separator size="1" />
        </Table.Cell>
      );
    }

    if (["required"].includes(cellText)) {
      return (
        <Table.Cell style={{ verticalAlign: "middle" }}>
          <Badge color="purple" size="1">
            required
          </Badge>
        </Table.Cell>
      );
    }

    return <Table.Cell {...props} />;
  },
  Accordion: {
    Root: (props) => <Accordion.Root mb="5" {...props} />,
    Header: ({ children, ...props }: { children?: React.ReactNode }) => (
      <Accordion.Header {...props}>
        <Text size="3" weight="bold">
          {children}
        </Text>
      </Accordion.Header>
    ),
    Content: ({ children, ...props }: { children?: React.ReactNode }) => (
      <Accordion.Content {...props}>
        {children}
        <Box mb="-4" />
      </Accordion.Content>
    ),
    Item: (props) => (
      <Accordion.Item
        // Introducing lint rule banning type assertions
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {...(props as React.ComponentProps<typeof Accordion.Item>)}
      />
    ),
  },
  Avatar,
  Badge,
  Callout: ({
    children,
    type,
  }: {
    children?: React.ReactNode;
    type?: "warning" | "error" | "info";
  }) => {
    const colorMap = { warning: "yellow", error: "red", info: "blue" } as const;
    const iconMap = {
      warning: ExclamationTriangleIcon,
      error: CrossCircledIcon,
      info: InfoCircledIcon,
    } as const;
    const Icon = type ? iconMap[type] : InfoCircledIcon;
    return (
      <Callout.Root color={type ? colorMap[type] : "gray"} my="5">
        <Callout.Icon>
          <Icon height="16" width="16" />
        </Callout.Icon>
        <Text as="div" className="rt-CalloutText" size="2">
          {children}
        </Text>
      </Callout.Root>
    );
  },
  Checklist: {
    Root: (props: React.ComponentProps<"div">) => <div {...props} />,
    Item: (props) => <ChecklistItem {...props} />,
  },
  Code,
  DefinitionList: {
    Root: (props) => <DefinitionList.Root mb="6" mt="5" {...props} />,
    Item: DefinitionList.Item,
    Term: DefinitionList.Term,
    Details: DefinitionList.Details,
  },
  CodeBlock: CodeBlock.Root,
  CodeBlockLine: CodeBlock.Line,
  CodeBlockLineGroup: CodeBlock.LineGroup,
  Combobox: {
    Root: Combobox.Root,
    Anchor: Combobox.Anchor,
    Footer: Combobox.Footer,
    Header: Combobox.Header,
    Input: Combobox.Input,
    InputSlot: Combobox.InputSlot,
    Popover: Combobox.Popover,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    Clear: Combobox.Clear as unknown as React.FC<React.PropsWithChildren>,
    Content: Combobox.Content,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    Item: Combobox.Item as unknown as React.FC<React.PropsWithChildren>,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ItemIndicator: Combobox.ItemIndicator as React.FC<React.PropsWithChildren>,
    ActionItem:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      Combobox.ActionItem as unknown as React.FC<React.PropsWithChildren>,
    Label: Combobox.Label,
    ScrollArea: Combobox.ScrollArea,
    SelectionList: Combobox.SelectionList,
    SelectionListItem:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      Combobox.SelectionListItem as unknown as React.FC<React.PropsWithChildren>,
    Separator: Combobox.Separator,
    Trigger: Combobox.Trigger,
  },
  Icons: {
    Check: ({ children, ...props }) => <CheckIcon {...props} />,
    Cross: ({ children, ...props }) => <Cross2Icon {...props} />,
  },
  Image: (props: React.ComponentPropsWithoutRef<typeof Image>) => (
    <Image mb="5" mt="4" {...props} />
  ),
  Marker: (props) => <Marker style={{ marginRight: "0.5em" }} {...props} />,
  PermanentLink: ({
    children,
    href = "",
    label = "",
  }: {
    children?: React.ReactNode;
    href?: string;
    label?: string;
  }) => (
    <PermanentLink href={href} label={label}>
      {children}
    </PermanentLink>
  ),
  QuickNav,
  RadioGroup: {
    Root: RadioGroup.Root,
    // Set an empty value to avoid the warning about the value prop being required
    Item: (props) => <RadioGroup.Item value="" {...props} />,
  },
  Screenshot: (props) => (
    <Zoomable my="6">
      <Screenshot.Root>
        <Screenshot.Image {...props} />
      </Screenshot.Root>
    </Zoomable>
  ),
  Small: (props) => <Text color="gray" size="2" weight="regular" {...props} />,
  Tabs: {
    Root: Tabs.Root,
    List: Tabs.List,
    Trigger: (props) => (
      // Introducing lint rule banning type assertions
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      <Tabs.Trigger {...(props as React.ComponentProps<typeof Tabs.Trigger>)} />
    ),
    Content: ({ children, ...props }: { children?: React.ReactNode }) => (
      // Introducing lint rule banning type assertions
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      <Tabs.Content {...(props as React.ComponentProps<typeof Tabs.Content>)}>
        <Box mt="5">{children}</Box>
      </Tabs.Content>
    ),
  },
  TabNav,
} as const;

interface ChecklistItemProps {
  id?: string;
  children?: React.ReactNode;
}

interface ChecklistItemState {
  id: string;
  state: boolean;
}

const ChecklistItem = ({ children, id }: ChecklistItemProps) => {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    const states = window.localStorage.getItem("@workos/checklist");
    if (states) {
      const [currentState] = JSON.parse(states).filter(
        (state: ChecklistItemState) => state.id === id,
      );

      if (currentState) {
        return setValue(currentState.state);
      }
    }
  }, [id]);

  const handleChange = (state: boolean) => {
    let checklist: ChecklistItemState[] = [];
    const states = window.localStorage.getItem("@workos/checklist");
    const checklistStates = states ? JSON.parse(states) : [];
    const [currentState] = checklistStates.filter((state: ChecklistItemState) => state.id === id);

    if (currentState) {
      checklist = checklistStates.map((checklistItem: ChecklistItemState) => {
        if (checklistItem.id === id) {
          return { ...checklistItem, state };
        }

        return checklistItem;
      });
    } else {
      checklist = [...checklistStates, { id, state }];
    }

    window.localStorage.setItem("@workos/checklist", JSON.stringify(checklist));
    setValue(state);
  };

  return (
    <Flex align="start" gap="2">
      <Flex align="center" height="24px">
        <Checkbox checked={value} id={id} onCheckedChange={handleChange} />
      </Flex>
      <label htmlFor={id}>{children}</label>
    </Flex>
  );
};

export function getTextFromReactElement(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return node.toString();
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromReactElement).join("");
  }

  if (isReactElement(node, ["children"])) {
    return getTextFromReactElement(node.props.children);
  }

  return "";
}

export { mdxComponents };
export type { MdxComponents };
