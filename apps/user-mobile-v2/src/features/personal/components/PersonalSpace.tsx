import { PersonalBillsScreen } from "./PersonalBillsScreen";
import { PersonalExpensesScreen } from "./PersonalExpensesScreen";
import { PersonalHomeScreen } from "./PersonalHomeScreen";
import { PersonalTaxScreen } from "./PersonalTaxScreen";

type PersonalView = "home" | "expenses" | "bills" | "tax" | "add";

type Props = {
  view: PersonalView;
  addOpen: boolean;
  onViewChange: (view: PersonalView) => void;
  onAddClose: () => void;
};

export function PersonalSpace({ view, addOpen, onViewChange, onAddClose }: Props) {
  // "+" footer button → open expenses screen with the add modal open
  if (view === "expenses" || addOpen) {
    return (
      <PersonalExpensesScreen
        onBack={() => { onAddClose(); onViewChange("home"); }}
        externalAddOpen={addOpen}
        onExternalAddClose={onAddClose}
      />
    );
  }
  if (view === "bills") return <PersonalBillsScreen onBack={() => onViewChange("home")} />;
  if (view === "tax")   return <PersonalTaxScreen onBack={() => onViewChange("home")} />;
  return <PersonalHomeScreen onNavigate={(tab) => onViewChange(tab as PersonalView)} />;
}
