import { useState, useMemo } from 'react';
import { useMembers, useMembersStats, useCreateMember, useUpdateMember, useDeleteMember } from './hooks';
import { MemberCard } from './MemberCard';
import { MembersFilters, type FiltersState } from './MembersFilters';
import { MemberModal, type MemberFormData } from './MemberModal';
import { useNotification } from '../../components/ui';
import { UsersIcon, AlertIcon, PlusIcon, SearchIcon } from '../../components/ui/Icons';
import type { Member } from '../../types/database';
import './members.css';

const initialFilters: FiltersState = {
    search: '',
    sectorId: null,
    status: null,
    position: null,
    onlyBaptized: false,
};

export function MembersPage() {
    const { data: members = [], isLoading, error } = useMembers();
    const stats = useMembersStats();
    const createMember = useCreateMember();
    const updateMember = useUpdateMember();
    const deleteMember = useDeleteMember();
    const { success, error: showError, confirm } = useNotification();

    const [filters, setFilters] = useState<FiltersState>(initialFilters);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit' | 'view';
        member: Member | null;
    }>({
        isOpen: false,
        mode: 'create',
        member: null,
    });

    // Filter members
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!member.full_name.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Sector filter
            if (filters.sectorId !== null && member.sector_id !== filters.sectorId) {
                return false;
            }

            // Status filter
            if (filters.status !== null && member.status !== filters.status) {
                return false;
            }

            // Position filter
            if (filters.position !== null && member.church_position !== filters.position) {
                return false;
            }

            // Baptized filter
            if (filters.onlyBaptized && !member.is_baptized) {
                return false;
            }

            return true;
        });
    }, [members, filters]);

    const handleOpenModal = (mode: 'create' | 'edit' | 'view', member: Member | null = null) => {
        setModalState({ isOpen: true, mode, member });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, mode: 'create', member: null });
    };

    const handleSaveMember = async (data: MemberFormData) => {
        try {
            if (modalState.mode === 'create') {
                await createMember.mutateAsync({
                    full_name: data.full_name,
                    dui: data.dui || undefined,
                    phone: data.phone || undefined,
                    address: data.address || undefined,
                    baptism_date: data.baptism_date || undefined,
                    sector_id: data.sector_id || undefined,
                    church_position: data.church_position,
                    status: data.status,
                });
                success('¡Miembro creado!', `${data.full_name} ha sido agregado exitosamente.`);
            } else if (modalState.mode === 'edit' && modalState.member) {
                await updateMember.mutateAsync({
                    id: modalState.member.id,
                    updates: {
                        full_name: data.full_name,
                        dui: data.dui || undefined,
                        phone: data.phone || undefined,
                        address: data.address || undefined,
                        baptism_date: data.baptism_date || undefined,
                        sector_id: data.sector_id || undefined,
                        church_position: data.church_position,
                        status: data.status,
                    },
                });
                success('¡Miembro actualizado!', `Los datos de ${data.full_name} han sido guardados.`);
            }
            handleCloseModal();
        } catch (err) {
            console.error('Error saving member:', err);
            showError('Error al guardar', 'No se pudo guardar el miembro. Intente nuevamente.');
        }
    };

    const handleDeleteMember = async (member: Member) => {
        const confirmed = await confirm({
            title: '¿Eliminar miembro?',
            message: `Esta acción eliminará permanentemente a "${member.full_name}" del sistema. Esta acción no se puede deshacer.`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
        });

        if (confirmed) {
            try {
                await deleteMember.mutateAsync(member.id);
                success('Miembro eliminado', `${member.full_name} ha sido eliminado del sistema.`);
            } catch (err) {
                console.error('Error deleting member:', err);
                showError('Error al eliminar', 'No se pudo eliminar el miembro. Intente nuevamente.');
            }
        }
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
    };

    if (error) {
        return (
            <div className="members-page">
                <div className="empty-state">
                    <div className="empty-state-icon"><AlertIcon size={48} color="#f59e0b" /></div>
                    <h3>Error al cargar los miembros</h3>
                    <p>Hubo un problema al obtener los datos. Por favor, intente nuevamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="members-page">
            {/* Header */}
            <header className="members-header">
                <h1><UsersIcon size={28} /> Miembros de la Iglesia</h1>
                <p>Gestiona la información de los miembros de la congregación</p>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-label">Total Miembros</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-number">{stats.activos}</div>
                    <div className="stat-label">Activos</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-number">{stats.inactivos}</div>
                    <div className="stat-label">Inactivos</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-number">{stats.bautizados}</div>
                    <div className="stat-label">Bautizados</div>
                </div>
            </div>

            {/* Search & Add Button */}
            <div className="search-actions-bar">
                <div className="search-container">
                    <span className="search-icon"><SearchIcon size={18} /></span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar miembros por nombre..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <button
                    className="add-member-btn"
                    onClick={() => handleOpenModal('create')}
                >
                    <PlusIcon size={18} /> Nuevo Miembro
                </button>
            </div>

            {/* Filters */}
            <MembersFilters
                filters={filters}
                onChange={setFilters}
                onClear={handleClearFilters}
            />

            {/* Members Grid */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando miembros...</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><UsersIcon size={48} color="#94a3b8" /></div>
                    <h3>No se encontraron miembros</h3>
                    <p>
                        {members.length === 0
                            ? 'Aún no hay miembros registrados. Comienza agregando el primero.'
                            : 'No hay miembros que coincidan con los filtros aplicados.'}
                    </p>
                </div>
            ) : (
                <div className="members-grid">
                    {filteredMembers.map(member => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            onView={(m) => handleOpenModal('view', m)}
                            onEdit={(m) => handleOpenModal('edit', m)}
                            onDelete={handleDeleteMember}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <MemberModal
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                member={modalState.member}
                onClose={handleCloseModal}
                onSave={handleSaveMember}
                isLoading={createMember.isPending || updateMember.isPending}
            />
        </div>
    );
}

export default MembersPage;
