import { createFileRoute, redirect } from "@tanstack/react-router";
import { isSection, type Section } from "@/data/clients";
import { useClient } from "@/lib/client-context";
import { useAppStore } from "@/store/useAppStore";
import { PrintCover, PrintSectionHeader } from "@/components/PrintCover";
import { PainelScreen } from "@/components/screens/PainelScreen";
import { FilasScreen } from "@/components/screens/FilasScreen";
import { CronogramaScreen } from "@/components/screens/CronogramaScreen";
import { EstoquesScreen } from "@/components/screens/EstoquesScreen";
import { JogosScreen } from "@/components/screens/JogosScreen";
import { CopilotoScreen } from "@/components/screens/CopilotoScreen";

export const Route = createFileRoute("/$clientId/$section")({
  beforeLoad: ({ params }) => {
    if (!isSection(params.section)) {
      throw redirect({
        to: "/$clientId/$section",
        params: { clientId: params.clientId, section: "painel" },
      });
    }
  },
  component: SectionView,
});

const SECTION_NAMES: Record<Section, string> = {
  painel: "PAINEL",
  filas: "FILAS",
  cronograma: "PERT/CPM",
  estoques: "EOQ/EPQ",
  jogos: "JOGOS",
  copiloto: "COPILOTO",
};

function SectionView() {
  const { section } = Route.useParams();
  const client = useClient();
  const printMode = useAppStore((s) => s.printMode);
  const printScope = useAppStore((s) => s.printScope);
  const sec = section as Section;
  const k = client.id;

  // Dossier: cover + every analytical front stacked (Copiloto excluded).
  if (printMode && printScope === "all") {
    return (
      <>
        <PrintCover client={client} />
        <PainelScreen key={`pa-${k}`} />
        <FilasScreen key={`fi-${k}`} />
        <CronogramaScreen key={`cr-${k}`} />
        <EstoquesScreen key={`es-${k}`} />
        <JogosScreen key={`jo-${k}`} />
      </>
    );
  }

  return (
    <>
      {printMode && printScope === "section" && (
        <PrintSectionHeader client={client} sectionName={SECTION_NAMES[sec]} />
      )}
      {sec === "painel" && <PainelScreen key={`pa-${k}`} />}
      {sec === "filas" && <FilasScreen key={`fi-${k}`} />}
      {sec === "cronograma" && <CronogramaScreen key={`cr-${k}`} />}
      {sec === "estoques" && <EstoquesScreen key={`es-${k}`} />}
      {sec === "jogos" && <JogosScreen key={`jo-${k}`} />}
      {sec === "copiloto" && <CopilotoScreen key={`co-${k}`} />}
    </>
  );
}
