import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SessionTimeoutDialogProps {
  secondsLeft: number | null;
  onKeepAlive: () => void;
  onLogout: () => void;
}

export function SessionTimeoutDialog({
  secondsLeft,
  onKeepAlive,
  onLogout,
}: SessionTimeoutDialogProps) {
  return (
    <AlertDialog open={secondsLeft !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Sigues ahí?</AlertDialogTitle>
          <AlertDialogDescription>
            Por inactividad, tu sesión se cerrará en {secondsLeft ?? 0}{' '}
            {secondsLeft === 1 ? 'segundo' : 'segundos'}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onLogout}>
            Cerrar sesión
          </Button>
          <Button onClick={onKeepAlive}>Seguir conectado</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
