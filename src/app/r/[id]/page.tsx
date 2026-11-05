import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RoomView } from "@/components/room/RoomView";
import { isRoomId } from "@/lib/room/ids";

export default function RoomPage({ params }: PageProps<"/r/[id]">) {
  return (
    <Suspense fallback={null}>
      <Room params={params} />
    </Suspense>
  );
}

async function Room({ params }: { params: PageProps<"/r/[id]">["params"] }) {
  const { id } = await params;
  if (!isRoomId(id)) notFound();
  return <RoomView roomId={id} />;
}
