"use client";

import * as React from "react";

/**
 * Creates a React context with a provider and a consumer hook. This overload
 * supports passing a primitive type as a single value via the `contextValue`
 * prop.
 */
function createContext<ContextValueType extends PrimitiveType>(
  rootComponentName: string,
  defaultValue?: ContextValueType,
): PrimitiveContextReturnType<ContextValueType>;

/**
 * Creates a React context with a provider and a consumer hook. This overload
 * supports passing an object type as a value via individual props.
 */
function createContext<ContextValueType extends object>(
  rootComponentName: string,
  defaultValue?: ContextValueType,
): ObjectContextReturnType<ContextValueType>;

function createContext<ContextValueType extends PrimitiveType | object>(
  rootComponentName: string,
  defaultValue?: ContextValueType,
) {
  const Context = React.createContext<ContextValueType | null>(defaultValue ?? null);

  type Props = ContextValueType extends PrimitiveType
    ? { children: React.ReactNode; contextValue: ContextValueType }
    : ContextValueType & { children: React.ReactNode };

  const Provider: React.FC<Props> = (props) => {
    const { children, ...providerProps } = props;
    // Only re-memoize when prop values change
    // Introducing lint rule banning type assertions
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const value = React.useMemo(
      () => {
        if ("contextValue" in providerProps) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          return (providerProps as { contextValue: ContextValueType }).contextValue;
        }

        return providerProps;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(providerProps),
    ) as ContextValueType;
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  function useContext(consumerName: string) {
    const context = React.useContext(Context);
    if (context === null) {
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }

    return context;
  }

  Provider.displayName = rootComponentName + "Provider";
  return [Provider, useContext] as const;
}

type PrimitiveType = string | number | boolean | null | undefined;

type PrimitiveContextReturnType<ContextValueType extends PrimitiveType> = [
  React.FC<{ children: React.ReactNode; contextValue: ContextValueType }>,
  (consumerName: string) => ContextValueType,
];

type ObjectContextReturnType<ContextValueType extends object & { contextValue?: never }> = [
  React.FC<ContextValueType & { children: React.ReactNode }>,
  (consumerName: string) => ContextValueType,
];

export { createContext };
