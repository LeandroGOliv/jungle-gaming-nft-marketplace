import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/hooks/use-profile'
import { useSignOut } from '@/hooks/use-sign-out'
import { describeRequestError } from '@/lib/http-error'
import { AccountLayout } from './account-layout'
import { ProfileForm } from './profile-form'

export function ProfileView() {
  const profile = useProfile()
  const { userId } = profile

  return (
    <AccountLayout active="perfil" title="Perfil do colecionador">
      {profile.isPending || !userId ? (
        <ProfileSkeleton />
      ) : profile.isError && !profile.data ? (
        <StateMessage title="Não foi possível carregar seu perfil">
          <p>{describeRequestError(profile.error)}</p>
          <div className="mt-6">
            <Button onClick={() => void profile.refetch()}>
              Tentar novamente
            </Button>
          </div>
        </StateMessage>
      ) : (
        <div aria-busy={profile.isFetching}>
          {/* Outro usuário recomeça o formulário; um refetch não apaga o que está sendo digitado. */}
          <ProfileForm key={userId} user={profile.data} />
        </div>
      )}
      <MobileSignOut />
    </AccountLayout>
  )
}

/**
 * Abaixo de 768 px não há header nem a barra lateral: o "Sair" da barra lateral
 * fica no fim do perfil, aonde a aba "Perfil" leva.
 */
function MobileSignOut() {
  const { signOut, isPending } = useSignOut()
  return (
    <div className="mt-10 border-t border-primary/30 pt-6 md:hidden">
      <button
        type="button"
        onClick={signOut}
        disabled={isPending}
        className="focus-ring flex h-10 cursor-pointer items-center gap-2 rounded-sm text-[15px] leading-[15px] font-bold text-text-accent disabled:opacity-50"
      >
        <img src="/icons/account-logout.svg" alt="" width={20} height={20} />
        Sair
      </button>
    </div>
  )
}

/** Mesma geometria do formulário: título, seis campos, três senhas e o botão. */
function ProfileSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <p className="sr-only">Carregando seu perfil…</p>
      <Skeleton className="h-4 w-[212px] rounded-[3px] max-lg:hidden" />
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="h-[15px] w-40 rounded-[3px]" />
            <Skeleton className="h-10 w-full rounded-[3px]" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-[125px] rounded-[3px]" />
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 md:w-[calc(50%-14px)]"
          >
            <Skeleton className="h-[15px] w-[100px] rounded-[3px]" />
            <Skeleton className="h-10 w-full rounded-[3px]" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-[3px] md:w-[131px]" />
    </div>
  )
}
