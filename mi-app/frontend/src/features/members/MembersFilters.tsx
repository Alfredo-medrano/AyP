import { useSectors } from '../sectors/hooks';
import type { ChurchRole, MemberStatus } from '../../types/database';
import { CHURCH_ROLES, MEMBER_STATUSES } from '../../types/database';

interface FiltersState {
    search: string;
    sectorId: number | null;
    status: MemberStatus | null;
    position: ChurchRole | null;
    onlyBaptized: boolean;
}

interface MembersFiltersProps {
    filters: FiltersState;
    onChange: (filters: FiltersState) => void;
    onClear: () => void;
}

export function MembersFilters({ filters, onChange, onClear }: MembersFiltersProps) {
    const { data: sectors = [] } = useSectors();

    const hasActiveFilters = filters.sectorId !== null ||
        filters.status !== null ||
        filters.position !== null ||
        filters.onlyBaptized;

    return (
        <div className="filters-section">
            <div className="filters-row">
                <div className="filter-group">
                    <label className="filter-label">Sector</label>
                    <select
                        className="filter-select"
                        value={filters.sectorId ?? ''}
                        onChange={(e) => onChange({
                            ...filters,
                            sectorId: e.target.value ? Number(e.target.value) : null
                        })}
                    >
                        <option value="">Todos los sectores</option>
                        {sectors.map(sector => (
                            <option key={sector.id} value={sector.id}>
                                {sector.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Estado</label>
                    <select
                        className="filter-select"
                        value={filters.status ?? ''}
                        onChange={(e) => onChange({
                            ...filters,
                            status: e.target.value as MemberStatus || null
                        })}
                    >
                        <option value="">Todos los estados</option>
                        {MEMBER_STATUSES.map(status => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Cargo</label>
                    <select
                        className="filter-select"
                        value={filters.position ?? ''}
                        onChange={(e) => onChange({
                            ...filters,
                            position: e.target.value as ChurchRole || null
                        })}
                    >
                        <option value="">Todos los cargos</option>
                        {CHURCH_ROLES.map(position => (
                            <option key={position} value={position}>
                                {position}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">&nbsp;</label>
                    <label className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={filters.onlyBaptized}
                            onChange={(e) => onChange({
                                ...filters,
                                onlyBaptized: e.target.checked
                            })}
                        />
                        Solo bautizados
                    </label>
                </div>

                {hasActiveFilters && (
                    <button
                        className="clear-filters-btn"
                        onClick={onClear}
                    >
                        ✕ Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}

export type { FiltersState };
export default MembersFilters;
