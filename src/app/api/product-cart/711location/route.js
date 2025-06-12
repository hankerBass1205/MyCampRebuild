export async function POST(req) {
  try {
    const formData = await req.formData();
    const storeData = Object.fromEntries(formData);

    // console.log("✅ 7-11 API 回傳的門市資料:", storeData); // 確保 API 收到資料

    return new Response(
      `<script>
            console.log("✅ 7-11 門市選擇成功，回傳母視窗");
            window.opener.postMessage(${JSON.stringify(storeData)}, "*");
            window.close();
        </script>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8", // ✅ 確保 HTML 以 UTF-8 編碼
        },
      }
    );
  } catch (error) {
    console.error("❌ 7-11 門市回傳錯誤:", error);
    return new Response(JSON.stringify({ error: "伺服器錯誤" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
