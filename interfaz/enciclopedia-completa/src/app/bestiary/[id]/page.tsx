import { notFound } from "next/navigation";
import { CreatureCodex, type CreatureRecord } from "@/components/bestiary/CreatureCodex";
import { supabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export default async function CreaturePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const response = await fetch(`${supabaseConfig.url}/rest/v1/creatures?source_id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: { apikey: supabaseConfig.publishableKey, Authorization: `Bearer ${supabaseConfig.publishableKey}` }, cache: "no-store" }); if (!response.ok) throw new Error("No se pudo abrir el registro del bestiario"); const [creature] = await response.json() as CreatureRecord[]; if (!creature) notFound(); return <CreatureCodex creature={creature} />; }
