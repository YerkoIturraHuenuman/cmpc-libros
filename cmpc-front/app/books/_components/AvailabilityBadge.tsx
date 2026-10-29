import { Badge } from '@/components/ui/badge';

export function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return isAvailable ? (
    <Badge className="bg-green-100 text-green-800">Disponible</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800">No disponible</Badge>
  );
}
