import { ListForm } from "@/components/list-form";
import { createList } from "../../actions";

export const metadata = { title: "Nueva lista — giftlist" };

export default function NewListPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Nueva lista</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ListForm action={createList} submitLabel="Crear lista" />
      </div>
    </div>
  );
}
