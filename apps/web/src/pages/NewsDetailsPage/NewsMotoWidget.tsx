import { useQuery } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { MotorcycleCard } from '@/entities/catalog';

export const NewsMotoWidget = ({ motoId }: { motoId: string }) => {

    const { data: moto, isLoading } = useQuery({
        queryKey: ['news-moto-widget', motoId],
        queryFn: () => $api.get(`/catalog/motorcycles/${motoId}`).then(res => res.data),
    });



    if (isLoading) return <div style={{ height: '300px', background: '#111', borderRadius: '12px' }} />;
    if (!moto) return null;

    return (
        <div style={{ margin: '40px 0' }}>
            <p style={{ color: '#f39c12', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Упомянутая модель:
            </p>
            {/* Твоя стандартная карточка */}
            <MotorcycleCard data={moto} viewMode="grid" />
        </div>
    );
};
