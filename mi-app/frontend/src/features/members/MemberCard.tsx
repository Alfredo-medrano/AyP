import type { Member } from '../../types/database';
import { MapPinIcon, PhoneIcon, CheckIcon, EyeIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';

interface MemberCardProps {
    member: Member;
    onView: (member: Member) => void;
    onEdit: (member: Member) => void;
    onDelete: (member: Member) => void;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

function getAvatarGradient(name: string): string {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
}

export function MemberCard({ member, onView, onEdit, onDelete }: MemberCardProps) {
    const statusClass = member.status === 'Activo'
        ? 'active'
        : member.status === 'Disciplinado'
            ? 'disciplined'
            : 'inactive';

    return (
        <div className={`member-card ${statusClass}`}>
            <div className="member-card-header">
                <div
                    className="member-avatar"
                    style={{ background: getAvatarGradient(member.full_name) }}
                >
                    {getInitials(member.full_name)}
                </div>
                <div className="member-info">
                    <h3 className="member-name">{member.full_name}</h3>
                    <span className="member-position">{member.church_position}</span>
                </div>
                <span className={`member-status-badge ${statusClass}`}>
                    {member.status}
                </span>
            </div>

            <div className="member-card-body">
                {member.sector && (
                    <div className="member-detail">
                        <span className="member-detail-icon"><MapPinIcon size={14} /></span>
                        <span className="member-detail-value">{member.sector.name}</span>
                    </div>
                )}

                {member.phone && (
                    <div className="member-detail">
                        <span className="member-detail-icon"><PhoneIcon size={14} /></span>
                        <span className="member-detail-value">{member.phone}</span>
                    </div>
                )}

                <div className="member-detail">
                    {member.is_baptized ? (
                        <span className="baptized-badge">
                            <CheckIcon size={14} /> Bautizado
                        </span>
                    ) : (
                        <span className="not-baptized-badge">
                            <span>○</span> Sin bautizar
                        </span>
                    )}
                </div>
            </div>

            <div className="member-card-actions">
                <button
                    className="action-btn view"
                    onClick={() => onView(member)}
                    title="Ver detalles"
                >
                    <EyeIcon size={14} /> Ver
                </button>
                <button
                    className="action-btn edit"
                    onClick={() => onEdit(member)}
                    title="Editar miembro"
                >
                    <EditIcon size={14} /> Editar
                </button>
                <button
                    className="action-btn delete"
                    onClick={() => onDelete(member)}
                    title="Eliminar miembro"
                >
                    <TrashIcon size={14} />
                </button>
            </div>
        </div>
    );
}

export default MemberCard;
