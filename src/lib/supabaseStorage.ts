/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import { supabase } from "./supabase";
import { OFFLINE_FARM } from "features/game/lib/landData";

export async function loadFarmFromSupabase(ownerAddress: string) {
  try {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("owner_address", ownerAddress.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading farm from Supabase:", error);
    }

    if (data && data.farm_data) {
      return {
        farmId: String(data.id),
        game: data.farm_data,
      };
    }

    // New player: Create farm record in Supabase
    const { data: newFarm, error: createError } = await supabase
      .from("farms")
      .insert({
        owner_address: ownerAddress.toLowerCase(),
        farm_data: OFFLINE_FARM,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating new farm in Supabase:", createError);
      return {
        farmId: "1",
        game: OFFLINE_FARM,
      };
    }

    return {
      farmId: String(newFarm.id),
      game: newFarm.farm_data,
    };
  } catch (err) {
    console.error("Supabase load exception:", err);
    return {
      farmId: "1",
      game: OFFLINE_FARM,
    };
  }
}

export async function saveFarmToSupabase(
  ownerAddress: string,
  gameState: any,
) {
  try {
    const { error } = await supabase
      .from("farms")
      .update({
        farm_data: gameState,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_address", ownerAddress.toLowerCase());

    if (error) {
      console.error("Error saving farm to Supabase:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Supabase save exception:", err);
    return false;
  }
}
