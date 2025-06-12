import db from "@/lib/db"; // 改用與 dashboard 相同的 DB 連接
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// 獲取所有會員列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 取得查詢參數
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "DESC";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const hideStatusZero = searchParams.get("hideStatusZero") === "1";
    const userId = searchParams.get("id"); // 取得單一會員 ID

    // 如果有提供 ID，獲取單一會員資料
    if (userId) {
      try {
        // 使用更明確的SQL查詢，確保所有欄位都會有默認值
        // 移除不存在的 google_user_id 欄位
        const query = `
          SELECT 
            id, 
            IFNULL(email, '') as email, 
            IFNULL(name, '') as name, 
            IFNULL(phone, '') as phone, 
            IFNULL(birthday, NULL) as birthday, 
            IFNULL(gender, 'other') as gender, 
            IFNULL(address, '') as address, 
            IFNULL(avatar, '') as avatar, 
            IFNULL(last_login, NOW()) as last_login, 
            IFNULL(status, 0) as status, 
            IFNULL(created_at, NOW()) as created_at, 
            IFNULL(updated_at, NOW()) as updated_at, 
            IFNULL(login_type, 'email') as login_type,
            IFNULL(level_id, 1) as level_id,
            IFNULL(points, 0) as points,
            IFNULL(line_user_id, '') as line_user_id,
            password
          FROM users 
          WHERE id = ?
        `;

        const [userResult] = await db.execute(query, [parseInt(userId)]);

        // 確保查詢結果存在
        if (!userResult || userResult.length === 0) {
          console.log(`找不到 ID 為 ${userId} 的會員`);
          return NextResponse.json(
            { success: false, message: "找不到會員" },
            { status: 404 }
          );
        }

        const user = userResult[0];
        console.log("獲取到的會員資料:", JSON.stringify(user, null, 2));

        // 處理可能缺失的欄位
        let displayEmail = user.email;

        if (!displayEmail || displayEmail === "") {
          if (user.login_type === "line" && user.line_user_id) {
            displayEmail = `LINE用戶(${user.line_user_id})`;
          } else if (user.login_type === "google") {
            // 用戶ID作為Google用戶的識別資訊
            displayEmail = `Google用戶(ID:${user.id})`;
          } else {
            displayEmail = `用戶${user.id}`;
          }
        }

        // 創建一個完整的用戶數據結構，確保所有需要的欄位都存在
        const userData = {
          id: user.id,
          email: displayEmail,
          name: user.name || `用戶${user.id}`,
          phone: user.phone || "",
          birthday: formatValidDate(user.birthday),
          gender: user.gender || "other",
          address: user.address || "",
          avatar: user.avatar || "",
          last_login: user.last_login || new Date(),
          status: typeof user.status === "number" ? user.status : 0,
          created_at: user.created_at || new Date(),
          updated_at: user.updated_at || new Date(),
          login_type: user.login_type || "unknown",
          level_id: user.level_id || 1,
          points: typeof user.points === "number" ? user.points : 0,
          line_user_id: user.line_user_id || "",
          // 移除 google_user_id 欄位
        };

        // 安全地處理密碼欄位 - 確保 password 屬性存在才解構
        if (user.password) {
          userData.password = "[PROTECTED]"; // 不返回實際密碼但保留欄位
        }

        console.log("處理後的會員資料:", JSON.stringify(userData, null, 2));
        return NextResponse.json({ success: true, data: userData });
      } catch (error) {
        console.error("獲取單一會員錯誤:", error);
        return NextResponse.json(
          { success: false, message: `獲取會員資料失敗: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // 構建查詢條件
    let whereClauses = ["1=1"];
    let queryParams = [];

    if (search) {
      whereClauses.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (hideStatusZero) {
      whereClauses.push("status != 0");
    }

    // 計算總數量
    const [totalResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClauses.join(" AND ")}`,
      queryParams
    );
    const totalUsers = totalResult[0].total;
    const totalPages = Math.ceil(totalUsers / perPage);

    // 檢查頁碼是否有效
    if (page > totalPages && totalPages > 0) {
      return NextResponse.json(
        { success: false, message: "頁碼超出範圍" },
        { status: 400 }
      );
    }

    // 修正 SQL 語法，增加對缺失欄位的處理
    try {
      // 使用 IFNULL 或 COALESCE 處理可能為 NULL 的欄位
      const query = `
        SELECT id, 
               IFNULL(email, '') as email, 
               IFNULL(name, '') as name, 
               IFNULL(phone, '') as phone, 
               IFNULL(birthday, NULL) as birthday, 
               IFNULL(gender, 'other') as gender, 
               IFNULL(address, '') as address, 
               IFNULL(avatar, '') as avatar, 
               last_login, 
               IFNULL(status, 0) as status, 
               IFNULL(created_at, NOW()) as created_at, 
               IFNULL(updated_at, NOW()) as updated_at, 
               IFNULL(login_type, '') as login_type, 
               level_id, 
               IFNULL(points, 0) as points,
               IFNULL(line_user_id, '') as line_user_id
        FROM users 
        WHERE ${whereClauses.join(" AND ")} 
        ORDER BY ${sort} ${order}
        LIMIT ? OFFSET ?
      `;

      // 修正參數列表，移除多餘的大括號
      const params = [...queryParams, parseInt(perPage), (page - 1) * perPage];

      // 執行查詢
      let users = [];
      try {
        const [result] = await db.execute(query, params);
        users = result || [];
      } catch (dbError) {
        console.error("DB 查詢執行錯誤:", dbError);
        console.error("SQL 查詢:", query);
        console.error("查詢參數:", params);
        return NextResponse.json(
          { success: false, message: `資料庫查詢失敗: ${dbError.message}` },
          { status: 500 }
        );
      }

      // 處理結果，確保每個會員記錄都有完整的欄位
      const processedUsers = users.map((user) => {
        // 對於 line 登入的用戶，使用 line_user_id 作為替代 email
        let displayEmail = user.email;

        if (!displayEmail || displayEmail === "") {
          if (user.login_type === "line" && user.line_user_id) {
            displayEmail = `LINE用戶(${user.line_user_id})`;
          } else if (user.login_type === "google") {
            displayEmail = `Google用戶(ID:${user.id})`;
          } else {
            displayEmail = `用戶${user.id}`;
          }
        }

        return {
          id: user.id,
          email: displayEmail,
          name: user.name || `用戶${user.id}`,
          phone: user.phone || "",
          birthday: formatValidDate(user.birthday), // 使用增強的日期處理函數
          gender: user.gender || "other",
          address: user.address || "",
          avatar: user.avatar || "",
          last_login: user.last_login,
          status: typeof user.status === "number" ? user.status : 0,
          created_at: user.created_at || new Date(),
          updated_at: user.updated_at || new Date(),
          login_type: user.login_type || "unknown",
          level_id: user.level_id,
          points: typeof user.points === "number" ? user.points : 0,
          line_user_id: user.line_user_id || "",
        };
      });

      // 獲取停用會員數量
      let statusZeroCount = 0;
      try {
        const [statusZeroResult] = await db.execute(
          `SELECT COUNT(*) as count FROM users WHERE status = 0`
        );
        statusZeroCount = statusZeroResult[0].count;
      } catch (countError) {
        console.error("計算停用會員數量錯誤:", countError);
      }

      return NextResponse.json({
        success: true,
        users: processedUsers,
        totalPages,
        currentPage: page,
        totalUsers,
        statusZeroCount,
      });
    } catch (sqlError) {
      console.error("SQL 查詢錯誤:", sqlError);
      console.error(
        "SQL 查詢內容:",
        `
        SELECT id, email, name, phone, birthday, gender, address, avatar, 
               last_login, status, created_at, updated_at, login_type, level_id, points
        FROM users 
        WHERE ${whereClauses.join(" AND ")} 
        ORDER BY ${sort} ${order}
        LIMIT ${parseInt(perPage)} OFFSET ${(page - 1) * perPage}
      `
      );

      return NextResponse.json(
        {
          success: false,
          message: `資料查詢失敗: ${sqlError.message || "SQL錯誤"}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("獲取會員列表錯誤:", error);
    return NextResponse.json(
      {
        success: false,
        message: `獲取會員列表失敗: ${error.message || "未知錯誤"}`,
      },
      { status: 500 }
    );
  }
}

// 新增會員
export async function POST(request) {
  try {
    const data = await request.json();

    // 檢查必要欄位
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { success: false, message: "請提供必要的會員資料" },
        { status: 400 }
      );
    }

    // 檢查電子郵件是否已存在
    const [existingUser] = await db.execute(
      `SELECT id FROM users WHERE email = ?`,
      [data.email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "此電子郵件已被使用" },
        { status: 400 }
      );
    }

    // 處理密碼加密
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 處理生日欄位 - 如果資料表不允許 NULL，則使用預設日期
    let birthdayValue = "0001-01-01"; // 使用一個明顯的預設日期作為未設定標記

    if (data.birthday && data.birthday.trim() !== "") {
      try {
        // 嘗試解析日期
        const birthdayDate = new Date(data.birthday);

        // 確認是有效日期
        if (!isNaN(birthdayDate.getTime())) {
          // 轉換為 YYYY-MM-DD 格式
          birthdayValue = birthdayDate.toISOString().split("T")[0];
        }
      } catch (dateError) {
        console.log("生日日期解析錯誤:", dateError.message);
        // 使用預設日期
      }
    }

    // 準備 SQL 查詢 - 始終包含生日欄位
    const query = `
      INSERT INTO users (name, email, password, phone, birthday, gender, address, status, login_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      data.name,
      data.email,
      hashedPassword,
      data.phone || "",
      birthdayValue, // 始終使用有效日期值，不使用 NULL
      data.gender || "other",
      data.address || "",
      parseInt(data.status || 1),
      "email",
    ];

    try {
      // 執行查詢
      const [insertResult] = await db.execute(query, values);
      const insertedId = insertResult.insertId;

      if (!insertedId) {
        return NextResponse.json({
          success: true,
          message: "會員資料已新增，但無法獲取新會員 ID",
        });
      }

      // 獲取新增的會員資料
      const [newUserResult] = await db.execute(
        `SELECT * FROM users WHERE id = ?`,
        [insertedId]
      );

      if (!newUserResult || newUserResult.length === 0) {
        return NextResponse.json({
          success: true,
          message: "會員已新增成功，但無法獲取詳細資料",
        });
      }

      // 安全地返回不含密碼的會員資料
      const userWithoutPassword = { ...newUserResult[0] };
      if ("password" in userWithoutPassword) {
        delete userWithoutPassword.password;
      }

      return NextResponse.json({
        success: true,
        message: "會員新增成功",
        user: userWithoutPassword,
      });
    } catch (sqlError) {
      // 更詳細地記錄 SQL 錯誤
      console.error("SQL 執行錯誤:", sqlError);
      console.error("嘗試執行的 SQL:", query);
      console.error("SQL 參數:", values);

      // 檢查是否為 "Column 'birthday' cannot be null" 錯誤
      if (
        sqlError.message &&
        sqlError.message.includes("birthday") &&
        sqlError.message.includes("null")
      ) {
        // 如果是生日欄位的錯誤，嘗試不包含生日欄位重新插入
        return await insertWithoutBirthday(data, hashedPassword);
      }

      throw sqlError; // 重新拋出其他 SQL 錯誤
    }
  } catch (error) {
    console.error("新增會員錯誤:", error);
    return NextResponse.json(
      { success: false, message: `新增會員失敗: ${error.message}` },
      { status: 500 }
    );
  }
}

// 更新會員資料
export async function PUT(request) {
  try {
    const data = await request.json();
    console.log("收到的更新資料:", data);

    // 檢查是否提供 ID
    if (!data.id) {
      return NextResponse.json(
        { success: false, message: "缺少會員 ID" },
        { status: 400 }
      );
    }

    // 使用更明確的查詢獲取現有用戶
    const query = `
      SELECT 
        id, 
        IFNULL(email, '') as email, 
        IFNULL(name, '') as name, 
        IFNULL(phone, '') as phone, 
        IFNULL(birthday, NULL) as birthday, 
        IFNULL(gender, 'other') as gender, 
        IFNULL(address, '') as address,
        IFNULL(status, 0) as status,
        IFNULL(login_type, 'email') as login_type,
        IFNULL(line_user_id, '') as line_user_id
      FROM users 
      WHERE id = ?
    `;

    // 檢查會員是否存在和登入類型
    const [existingUserResult] = await db.execute(query, [parseInt(data.id)]);

    if (!existingUserResult || existingUserResult.length === 0) {
      console.log(`找不到 ID 為 ${data.id} 的會員`);
      return NextResponse.json(
        { success: false, message: "會員不存在" },
        { status: 404 }
      );
    }

    // 先獲取用戶數據
    const user = existingUserResult[0];
    console.log("獲取到的現有會員資料:", JSON.stringify(user, null, 2));

    // 定義登入類型
    const isLineUser = user.login_type === "line";
    const isGoogleUser = user.login_type === "google";

    // 初始化更新欄位和參數陣列
    const updateFields = [
      "name = ?",
      "phone = ?",
      "address = ?",
      "updated_at = NOW()",
    ];

    // 只添加一次參數
    const updateParams = [
      data.name || user.name,
      data.phone || user.phone || "",
      data.address || user.address || "",
    ];

    // 處理生日欄位 - 明確設置值而不是使用 NULL
    if (data.birthday !== undefined) {
      if (data.birthday && data.birthday.trim() !== "") {
        try {
          const birthdayDate = new Date(data.birthday);
          if (!isNaN(birthdayDate.getTime())) {
            updateFields.push("birthday = ?");
            updateParams.push(birthdayDate.toISOString().split("T")[0]);
          }
        } catch (dateError) {
          console.error("生日格式錯誤:", dateError);
        }
      } else {
        // 如果提供了空值，將生日設為預設日期
        updateFields.push("birthday = ?");
        updateParams.push("0001-01-01");
      }
    }

    // 如果提供了性別
    if (data.gender) {
      updateFields.push("gender = ?");
      updateParams.push(data.gender);
    }

    // 如果提供了狀態
    if (data.status !== undefined) {
      updateFields.push("status = ?");
      updateParams.push(parseInt(data.status));
    }

    // 如果提供了密碼且不是第三方登入用戶才更新密碼
    if (data.password && !isLineUser && !isGoogleUser) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.push("password = ?");
      updateParams.push(hashedPassword);
    }

    // 針對email的特殊處理 - 只有普通登入用戶才允許更新email
    // 這裡不需要再修改，因為前端已經過濾掉了不應該提交的email欄位

    console.log("更新欄位:", updateFields);
    console.log("更新參數:", updateParams);

    // 更新會員
    await db.execute(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateParams, parseInt(data.id)]
    );

    // 獲取更新後的會員資料
    const [updatedUser] = await db.execute(
      `
      SELECT 
        id, 
        IFNULL(email, '') as email, 
        IFNULL(name, '') as name, 
        IFNULL(phone, '') as phone, 
        IFNULL(birthday, NULL) as birthday, 
        IFNULL(gender, 'other') as gender, 
        IFNULL(address, '') as address, 
        IFNULL(avatar, '') as avatar, 
        IFNULL(last_login, NOW()) as last_login, 
        IFNULL(status, 0) as status, 
        IFNULL(created_at, NOW()) as created_at, 
        IFNULL(updated_at, NOW()) as updated_at, 
        IFNULL(login_type, 'email') as login_type,
        IFNULL(level_id, 1) as level_id,
        IFNULL(points, 0) as points,
        IFNULL(line_user_id, '') as line_user_id,
        password
      FROM users 
      WHERE id = ?
    `,
      [parseInt(data.id)]
    );

    // 返回結果，安全地處理密碼欄位
    if (updatedUser && updatedUser.length > 0) {
      let userWithoutPassword = { ...updatedUser[0] };
      if (userWithoutPassword.password !== undefined) {
        delete userWithoutPassword.password;
      }

      // 處理生日欄位
      if (userWithoutPassword.birthday) {
        userWithoutPassword.birthday = formatValidDate(
          userWithoutPassword.birthday
        );
      }

      return NextResponse.json({ success: true, user: userWithoutPassword });
    }

    return NextResponse.json({ success: true, message: "會員更新成功" });
  } catch (error) {
    console.error("更新會員錯誤:", error);
    return NextResponse.json(
      { success: false, message: `更新會員失敗: ${error.message}` },
      { status: 500 }
    );
  }
}

// 更新會員狀態 (停用/啟用)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const status = searchParams.get("status") === "1" ? 1 : 0;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "缺少會員 ID" },
        { status: 400 }
      );
    }

    // 更新會員狀態
    await db.execute(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, parseInt(userId)]
    );

    // 獲取更新後的會員資料
    const [updatedUser] = await db.execute(`SELECT * FROM users WHERE id = ?`, [
      parseInt(userId),
    ]);

    // 處理返回的用戶數據，確保生日欄位正確
    let userToReturn = null;
    if (updatedUser.length > 0) {
      userToReturn = { ...updatedUser[0] };
      // 處理密碼和生日
      if (userToReturn.password !== undefined) {
        delete userToReturn.password;
      }
      if (userToReturn.birthday) {
        userToReturn.birthday = formatValidDate(userToReturn.birthday);
      }
    }

    return NextResponse.json({
      success: true,
      message: status ? "會員已啟用" : "會員已停用",
      user: userToReturn,
    });
  } catch (error) {
    console.error("更新會員狀態錯誤:", error);
    return NextResponse.json(
      { success: false, message: "更新會員狀態失敗" },
      { status: 500 }
    );
  }
}

// 格式化有效日期的輔助函數 - 增強以處理更多邊緣情況
function formatValidDate(dateStr) {
  if (!dateStr) return null;

  // 檢查是否是無效日期格式
  if (typeof dateStr === "string") {
    // 檢查所有可能的默認日期或無效日期格式
    if (
      dateStr === "0000-00-00" ||
      dateStr === "0001-01-01" ||
      dateStr.startsWith("0000-") ||
      dateStr.startsWith("0001-01-01") ||
      dateStr === "NULL" ||
      dateStr === "null"
    ) {
      return null;
    }
  }

  try {
    const dateObj = new Date(dateStr);

    // 檢查是否是有效日期
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // 檢查日期是否特別早（可能是默認值）
    const year = dateObj.getFullYear();
    if (year < 1900) {
      return null;
    }

    return dateObj;
  } catch (e) {
    return null;
  }
}

// 插入無生日的會員（這個函數在原始代碼中未定義，此處假設它是作為備用方法）
async function insertWithoutBirthday(data, hashedPassword) {
  try {
    // 使用明確的預設日期而非 NULL
    const query = `
      INSERT INTO users (name, email, password, phone, birthday, gender, address, status, login_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, '0001-01-01', ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      data.name,
      data.email,
      hashedPassword,
      data.phone || "",
      data.gender || "other",
      data.address || "",
      parseInt(data.status || 1),
      "email",
    ];

    const [insertResult] = await db.execute(query, values);
    return NextResponse.json({
      success: true,
      message: "會員新增成功 (使用預設生日)",
      userId: insertResult.insertId,
    });
  } catch (backupError) {
    console.error("備用插入方法也失敗:", backupError);
    return NextResponse.json(
      { success: false, message: `新增會員失敗: ${backupError.message}` },
      { status: 500 }
    );
  }
}
