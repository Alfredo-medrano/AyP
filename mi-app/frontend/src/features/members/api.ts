import { supabase } from '../../lib/supabase';
import { saveToLocal, getAllFromLocal } from '../../lib/indexeddb';
import { addToQueue } from '../../services/offlineQueue';
import type { Member, ChurchRole, MemberStatus } from '../../types/database';

export interface CreateMemberInput {
    full_name: string;
    dui?: string;
    phone?: string;
    address?: string;
    baptism_date?: string;
    sector_id?: number;
    church_position?: ChurchRole;
    status?: MemberStatus;
}

export async function getMembers(): Promise<Member[]> {
    if (!navigator.onLine) {
        return getAllFromLocal<Member>('members');
    }

    const { data, error } = await supabase
        .from('members')
        .select('*, sector:sectors(*)')
        .order('full_name', { ascending: true });

    if (error) throw error;

    if (data) {
        for (const member of data) {
            if (member) {
                await saveToLocal('members', { ...(member as Member), sincronizado: true });
            }
        }
    }

    return (data || []) as Member[];
}

export async function getMemberById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
        .from('members')
        .select('*, sector:sectors(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Member;
}

export async function getMembersBySector(sectorId: number): Promise<Member[]> {
    const { data, error } = await supabase
        .from('members')
        .select('*, sector:sectors(*)')
        .eq('sector_id', sectorId)
        .order('full_name', { ascending: true });

    if (error) throw error;
    return (data || []) as Member[];
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
    const member = {
        ...input,
        id: crypto.randomUUID(),
        church_position: input.church_position || 'Miembro',
        status: input.status || 'Activo',
    };

    if (!navigator.onLine) {
        const localMember: Member = {
            ...member,
            dui: input.dui || null,
            phone: input.phone || null,
            address: input.address || null,
            baptism_date: input.baptism_date || null,
            is_baptized: !!input.baptism_date,
            sector_id: input.sector_id || null,
            church_position: member.church_position as ChurchRole,
            status: member.status as MemberStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
        };
        await saveToLocal('members', { ...localMember, sincronizado: false });
        await addToQueue({
            tabla: 'members',
            operacion: 'INSERT',
            datos: member,
        });
        return localMember;
    }

    const { data, error } = await supabase
        .from('members')
        .insert(member as never)
        .select('*, sector:sectors(*)')
        .single();

    if (error) throw error;

    const savedMember = data as Member;
    await saveToLocal('members', { ...savedMember, sincronizado: true });
    return savedMember;
}

export async function updateMember(id: string, updates: Partial<CreateMemberInput>): Promise<Member> {
    const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
    };

    if (!navigator.onLine) {
        await addToQueue({
            tabla: 'members',
            operacion: 'UPDATE',
            datos: { id, ...updateData },
        });
    }

    const { data, error } = await supabase
        .from('members')
        .update(updateData as never)
        .eq('id', id)
        .select('*, sector:sectors(*)')
        .single();

    if (error) throw error;

    const savedMember = data as Member;
    await saveToLocal('members', { ...savedMember, sincronizado: true });
    return savedMember;
}

export async function deleteMember(id: string): Promise<void> {
    if (!navigator.onLine) {
        await addToQueue({
            tabla: 'members',
            operacion: 'DELETE',
            datos: { id },
        });
        return;
    }

    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
}

export default {
    getMembers,
    getMemberById,
    getMembersBySector,
    createMember,
    updateMember,
    deleteMember,
};
