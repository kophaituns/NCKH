import './GlobalStyles.scss';

interface GlobalStylesProps {
  children?: React.ReactNode;
}

export default function GlobalStyles({ children }: GlobalStylesProps) {
  return <>{children}</>;
}
