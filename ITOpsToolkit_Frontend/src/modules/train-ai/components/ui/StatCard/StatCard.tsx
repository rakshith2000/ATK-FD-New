import { memo, type ReactNode } from 'react';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import styles from './StatCard.module.scss';

export type StatCardVariant = 'navy' | 'blue' | 'sky' | 'light' | 'mint' | 'lavender';

export interface StatCardProps {
    title: string;
    value: ReactNode;
    subtitle?: string;
    variant?: StatCardVariant;
    icon?: ReactNode;
    className?: ClassNameValue;
}

/** A single dashboard metric tile (title, big value, supporting subtitle). */
const StatCard: React.FC<StatCardProps> = memo(({ title, value, subtitle, variant = 'blue', icon, className }) => {
    return (
        <div className={twMerge(styles.card, styles[variant], className)}>
            {/* Decorative background shapes */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-20 w-20 rounded-full bg-white/5" />

            {icon ? <span className={styles.icon}>{icon}</span> : null}
            <span className={twMerge(styles.title, 'relative z-10')}>{title}</span>
            <span className={twMerge(styles.value, 'relative z-10')}>{value}</span>
            {subtitle ? <span className={twMerge(styles.subtitle, 'relative z-10')}>{subtitle}</span> : null}
        </div>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
