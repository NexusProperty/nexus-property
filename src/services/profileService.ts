import { supabase } from "@/lib/supabase";
import { User } from "@/types/auth";

/**
 * Fetches the current user's profile
 */
export const fetchUserProfile = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
  
  return data;
};

/**
 * Updates the current user's profile
 */
export const updateUserProfile = async (profileData: Partial<User>): Promise<User> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
  
  return data;
};

/**
 * Updates the user's avatar
 */
export const updateUserAvatar = async (file: File): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // Upload the file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);
    
  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw uploadError;
  }
  
  // Get the public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
    
  // Update the user's profile with the new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", user.id);
    
  if (updateError) {
    console.error("Error updating avatar URL:", updateError);
    throw updateError;
  }
  
  return data.publicUrl;
}; 