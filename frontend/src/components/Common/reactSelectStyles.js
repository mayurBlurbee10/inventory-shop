export const getReactSelectStyles = ({ isInvalid = false, isDisabled = false } = {}) => ({
  control: (base, state) => ({
    ...base,
    minHeight: "2.75rem",
    backgroundColor: isDisabled
      ? "hsl(var(--muted))"
      : "hsl(var(--background))",
    borderColor: isInvalid
      ? "hsl(var(--destructive))"
      : state.isFocused
        ? "hsl(var(--ring))"
        : "hsl(var(--border))",
    boxShadow: isInvalid
      ? state.isFocused
        ? "0 0 0 3px hsl(var(--destructive) / 0.2)"
        : "none"
      : state.isFocused
        ? "0 0 0 3px hsl(var(--ring) / 0.5)"
        : "none",
    borderRadius: "0.5rem",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 1 : 1,
    "&:hover": {
      borderColor: isInvalid
        ? "hsl(var(--destructive))"
        : "hsl(var(--border))",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0.25rem 0.75rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: isDisabled
      ? "hsl(var(--muted-foreground))"
      : "hsl(var(--foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    overflow: "hidden",
    zIndex: 50,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    padding: "0.25rem",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.375rem",
    backgroundColor: state.isSelected
      ? "hsl(var(--accent))"
      : state.isFocused
        ? "hsl(var(--accent) / 0.7)"
        : "transparent",
    color:
      state.isSelected || state.isFocused
        ? "hsl(var(--accent-foreground))"
        : "hsl(var(--foreground))",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
  loadingIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
});
