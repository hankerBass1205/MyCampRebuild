import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const ownerId = session.user.id;

    // 只獲取 status = 1 (已通過) 的營地
    const [spots] = await db.query(
      `SELECT 
        ca.application_id as id,
        ca.name,
        ca.address,
        ca.image_url,
        ca.operation_status,
        ca.status,
        ca.description,
        GROUP_CONCAT(DISTINCT csa.spot_id) as spot_ids,
        GROUP_CONCAT(DISTINCT csa.name) as spot_names
       FROM camp_applications ca
       LEFT JOIN camp_spot_applications csa ON ca.application_id = csa.application_id
       WHERE ca.owner_id = ? 
       AND ca.status = 1
       GROUP BY ca.application_id
       ORDER BY ca.created_at DESC`,
      [ownerId]
    );

    // console.log('原始查詢結果:', spots); // 添加調試日誌

    const processedSpots = spots.map(spot => ({
      id: spot.id,
      name: spot.name,
      address: spot.address,
      image_url: spot.image_url,
      operation_status: spot.operation_status,
      status: spot.status,
      description: spot.description,
      city: spot.address ? spot.address.split('縣')[0].split('市')[0] + (spot.address.includes('縣') ? '縣' : '市') : '',
      spots: spot.spot_ids ? spot.spot_ids.split(',').map((id, index) => ({
        id: id,
        name: spot.spot_names.split(',')[index]
      })) : []
    }));

    // console.log('處理後的營地列表:', processedSpots); // 添加調試日誌

    return NextResponse.json({
      spots: processedSpots
    });

  } catch (error) {
    console.error('獲取營地列表失敗:', error);
    return NextResponse.json(
      { error: '獲取營地列表失敗' },
      { status: 500 }
    );
  }
} 