import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Marketplace de NFTs</h1>
    </main>
  )
}
