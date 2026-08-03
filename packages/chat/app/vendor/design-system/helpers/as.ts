import * as React from "react";

export type As<
  DefaultTag extends React.ElementType,
  T1 extends React.ElementType,
  T2 extends React.ElementType = T1,
  T3 extends React.ElementType = T1,
  T4 extends React.ElementType = T1,
  T5 extends React.ElementType = T1,
> =
  | (PropsWithoutColor<DefaultTag> & {
      as?: DefaultTag;
    })
  | (PropsWithoutColor<T1> & {
      as: T1;
    })
  | (PropsWithoutColor<T2> & {
      as: T2;
    })
  | (PropsWithoutColor<T3> & {
      as: T3;
    })
  | (PropsWithoutColor<T4> & {
      as: T4;
    })
  | (PropsWithoutColor<T5> & {
      as: T5;
    });

// `interface HTMLAttributes` includes 'color', which may lead to clashes
type PropsWithoutColor<T extends React.ElementType> = Omit<React.ComponentPropsWithRef<T>, "color">;
