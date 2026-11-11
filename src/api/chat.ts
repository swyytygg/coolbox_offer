import { supabase } from "../utils/supabase";
import { reportErrorToTelegram } from "../utils/telegram_logger";

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  sender_name: string;
  content: string;
  is_bot: boolean;
  created_at: string;
}

export const fetchMessages = async (groupId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('coolbox_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data;
};

export const sendMessage = async (groupId: string, userId: string, senderName: string, content: string, isBot: boolean = false) => {
  const { data, error } = await supabase
    .from('coolbox_messages')
    .insert({
      group_id: groupId,
      user_id: userId,
      sender_name: senderName,
      content,
      is_bot: isBot
    })
    .select()
    .single();

  if (error) {
    console.error("채팅 메시지 발송 실패:", error);
    reportErrorToTelegram("채팅 추가 (발송) 불발", error);
    throw error;
  }
  return data;
};

// [신규] 메시지 삭제 기능 (및 텔레그램 불발 보고)
export const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('coolbox_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error("채팅 메시지 삭제 실패:", error);
    reportErrorToTelegram("채팅 삭제 불발", error);
    throw error;
  }
  return true;
};
