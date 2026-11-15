import { createFileRoute } from '@tanstack/react-router'
import { SimulationPanel } from '@/components/simulation/simulation-panel'

export const Route = createFileRoute('/_public/simulacao')({
  component: SimulationPanel,
})
