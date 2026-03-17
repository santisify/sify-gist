// app/api/gists/[id]/export/route.ts
import { NextRequest } from 'next/server';
import { getGistById } from '@/lib/gists';
import JSZip from 'jszip';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const gist = await getGistById(params.id);
    
    if (!gist) {
      return new Response('Gist 不存在', {
        status: 404,
      });
    }
    
    // 创建 ZIP 文件
    const zip = new JSZip();
    
    // 添加文件到 ZIP
    for (const file of gist.files) {
      zip.file(file.filename, file.content);
    }
    
    // 生成 ZIP 二进制数据
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // 返回 ZIP 文件
    // @ts-ignore
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${gist.title || 'gist'}-${params.id}.zip"`,
      },
    });
  } catch (error) {
    console.error('导出 Gist 时出错:', error);
    return new Response('服务器错误', {
      status: 500,
    });
  }
}