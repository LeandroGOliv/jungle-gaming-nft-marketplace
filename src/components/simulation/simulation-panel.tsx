import { formatEth } from '@/utils/eth'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useExpireSessions,
  useSettleOrder,
  useHealthCheck,
  useResetSimulation,
  useSimulation,
  useUpdateSimulation,
} from '@/hooks/use-simulation'
import { describeRequestError } from '@/lib/http-error'
import type {
  LatencyPresetId,
  LatencyProfile,
  ScenarioId,
  SimulationState,
} from '@/types/simulation'

function sameProfile(a: LatencyProfile, b: LatencyProfile) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(iso))
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000)
  return minutes >= 60 && minutes % 60 === 0
    ? `${minutes / 60} h`
    : `${minutes} min`
}

export function SimulationPanel() {
  const simulation = useSimulation()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary">Simulação</h1>
        <p className="text-sm text-muted-foreground">
          Controle os dados e as condições de rede da API simulada. Trocar de
          cenário ou restaurar os dados volta ao estado inicial conhecido.
        </p>
      </header>

      {simulation.isPending ? (
        <PanelSkeleton />
      ) : simulation.isError ? (
        <section
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6"
        >
          <p className="text-text-primary">
            Não foi possível carregar a simulação.
          </p>
          <p className="text-sm text-muted-foreground">
            {describeRequestError(simulation.error)} Os mocks podem estar
            desligados neste ambiente.
          </p>
          <Button onClick={() => void simulation.refetch()}>
            Tentar novamente
          </Button>
        </section>
      ) : (
        <SimulationControls state={simulation.data} />
      )}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function SimulationControls({ state }: { state: SimulationState }) {
  const reset = useResetSimulation()
  const update = useUpdateSimulation()
  const expire = useExpireSessions()
  const settle = useSettleOrder()
  const [scenario, setScenario] = useState<ScenarioId>(state.scenarioId)
  const activeScenario = state.scenarios.find((s) => s.id === state.scenarioId)
  const activeLatency = state.latencyPresets.find((p) =>
    sameProfile(p.profile, state.latency),
  )
  const feedbackError =
    reset.error ?? update.error ?? expire.error ?? settle.error

  return (
    <>
      <section
        aria-labelledby="simulation-status"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-status" className="mb-4 text-lg font-medium">
          Estado atual
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted-foreground">Cenário</dt>
          <dd data-testid="active-scenario">{activeScenario?.label}</dd>
          <dt className="text-muted-foreground">Latência</dt>
          <dd>{activeLatency?.label ?? 'Personalizada'}</dd>
          <dt className="text-muted-foreground">Falhas ativas</dt>
          <dd>{state.faults.length === 0 ? 'Nenhuma' : state.faults.length}</dd>
          <dt className="text-muted-foreground">Tempo real</dt>
          <dd>
            {state.realtimeAvailable ? 'Disponível' : 'Indisponível'} ·{' '}
            {state.realtimeConnections} conexão(ões)
          </dd>
          <dt className="text-muted-foreground">Dados</dt>
          <dd data-testid="data-counts">
            {state.counts.nfts} NFTs · {state.counts.users} usuários ·{' '}
            {state.counts.orders} pedidos
          </dd>
          <dt className="text-muted-foreground">Último reset</dt>
          <dd>{formatDateTime(state.resetAt)}</dd>
        </dl>
      </section>

      <section
        aria-labelledby="simulation-scenario"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-scenario" className="text-lg font-medium">
          Cenário
        </h2>
        <RadioGroup
          aria-labelledby="simulation-scenario"
          value={scenario}
          onValueChange={(value) => setScenario(value as ScenarioId)}
          className="gap-4"
        >
          {state.scenarios.map((item) => (
            <OptionRow
              key={item.id}
              value={item.id}
              label={item.label}
              description={item.description}
            />
          ))}
        </RadioGroup>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={reset.isPending}
            onClick={() => reset.mutate({ scenarioId: scenario })}
          >
            Aplicar cenário
          </Button>
          <Button
            variant="outline"
            disabled={reset.isPending}
            onClick={() => reset.mutate({})}
          >
            Restaurar dados do cenário
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="simulation-latency"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-latency" className="text-lg font-medium">
          Latência
        </h2>
        <RadioGroup
          aria-labelledby="simulation-latency"
          value={activeLatency?.id ?? ''}
          onValueChange={(value) => {
            const preset = state.latencyPresets.find(
              (p) => p.id === (value as LatencyPresetId),
            )
            if (preset) update.mutate({ latency: preset.profile })
          }}
          className="gap-3"
        >
          {state.latencyPresets.map((preset) => (
            <OptionRow key={preset.id} value={preset.id} label={preset.label} />
          ))}
        </RadioGroup>
      </section>

      <section
        aria-labelledby="simulation-realtime"
        className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-realtime" className="text-lg font-medium">
          Tempo real
        </h2>
        <p className="text-sm text-muted-foreground">
          Derrubar as conexões Socket.IO simula uma queda; o cliente tenta
          reconectar até a conexão ser restabelecida.
        </p>
        <Button
          variant="outline"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({ realtimeAvailable: !state.realtimeAvailable })
          }
        >
          {state.realtimeAvailable
            ? 'Derrubar conexões'
            : 'Restabelecer conexões'}
        </Button>
      </section>

      <section
        aria-labelledby="simulation-session"
        className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-session" className="text-lg font-medium">
          Sessão
        </h2>
        <p className="text-sm text-muted-foreground">
          As sessões valem {formatDuration(state.sessionTtlMs)} neste cenário.
          Expirar agora faz a próxima ação autenticada pedir login de novo,
          mantendo a tela em que o colecionador estava.
        </p>
        <Button
          variant="outline"
          disabled={expire.isPending}
          onClick={() => expire.mutate()}
        >
          Expirar sessões
        </Button>
      </section>

      <section
        aria-labelledby="simulation-orders"
        className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="simulation-orders" className="text-lg font-medium">
          Pedidos pendentes
        </h2>
        <p className="text-sm text-muted-foreground">
          Fora do cenário “Pedido fica pendente”, o pagamento é decidido sozinho
          segundos depois da criação. Decidir aqui emite order.updated ao dono
          do pedido.
        </p>
        {state.pendingOrders.length === 0 ? (
          <p className="text-sm">Nenhum pedido aguardando pagamento.</p>
        ) : (
          <ul className="flex w-full flex-col gap-3">
            {state.pendingOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-sm">
                  {order.id} · {order.userId} · {formatEth(order.totalEth)}
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={settle.isPending}
                    onClick={() =>
                      settle.mutate({ orderId: order.id, outcome: 'confirmed' })
                    }
                    aria-label={`Confirmar o pagamento do pedido ${order.id}`}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={settle.isPending}
                    onClick={() =>
                      settle.mutate({ orderId: order.id, outcome: 'refused' })
                    }
                    aria-label={`Recusar o pagamento do pedido ${order.id}`}
                  >
                    Recusar
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <HealthProbe />

      <p role="status" aria-live="polite" className="text-sm">
        {feedbackError
          ? describeRequestError(feedbackError)
          : settle.isSuccess
            ? `Pedido ${settle.variables.orderId} ${settle.variables.outcome === 'confirmed' ? 'confirmado' : 'recusado'}.`
            : expire.isSuccess
              ? 'Sessões expiradas.'
              : reset.isSuccess
                ? 'Dados restaurados.'
                : ''}
      </p>
    </>
  )
}

function OptionRow({
  value,
  label,
  description,
}: {
  value: string
  label: string
  description?: string
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

function HealthProbe() {
  const probe = useHealthCheck()

  return (
    <section
      aria-labelledby="simulation-probe"
      className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6"
    >
      <h2 id="simulation-probe" className="text-lg font-medium">
        Testar requisição
      </h2>
      <p className="text-sm text-muted-foreground">
        Faz uma chamada comum à API, sujeita à latência e às falhas do cenário.
      </p>
      <Button
        variant="secondary"
        disabled={probe.isPending}
        onClick={() => probe.mutate()}
      >
        {probe.isPending ? 'Aguardando resposta…' : 'Enviar requisição'}
      </Button>
      <p
        role="status"
        aria-live="polite"
        data-testid="probe-result"
        className="text-sm"
      >
        {probe.isSuccess && `Resposta recebida em ${probe.data.durationMs} ms.`}
        {probe.isError && `Falhou: ${describeRequestError(probe.error)}`}
      </p>
    </section>
  )
}
