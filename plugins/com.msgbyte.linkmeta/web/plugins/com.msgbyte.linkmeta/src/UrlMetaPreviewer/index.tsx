import React from 'react';
import { useAsync } from '@capital/common';
import { LoadingSpinner } from '@capital/component';
import { request } from '../request';
import { get } from 'lodash-es';
import './index.less';

type MetaInfo = any;
const metaCache: Record<string, MetaInfo | null> = {};

export const UrlMetaPreviewer: React.FC<{
  url: string;
}> = React.memo((props) => {
  const {
    error,
    value: meta,
    loading,
  } = useAsync(async () => {
    if (metaCache[props.url] !== undefined) {
      return metaCache[props.url];
    }

    try {
      const { data } = await request.post('fetch', {
        url: props.url,
      });

      metaCache[props.url] = data;

      return data;
    } catch (e) {
      console.warn('[linkmeta] fetch url meta info error', e);
      metaCache[props.url] = null;

      return null;
    }
  }, [props.url]);

  if (error || meta === null) {
    return null;
  }

  return (
    <div className="plugin-linkmeta-previewer">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="main" onClick={() => window.open(meta.url)}>
          <div className="title">{get(meta, 'title')}</div>
          <div className="description">{get(meta, 'description')}</div>
          {/* TODO: 因为图片可能会被跨域拦截，因此暂时先不处理。回头下载图片到minio上再获取 */}
          {/* {get(meta, 'images.0') && (
            <div className="image">
              <img src={get(meta, 'images.0')} />
            </div>
          )} */}
        </div>
      )}
    </div>
  );
});
UrlMetaPreviewer.displayName = 'UrlMetaPreviewer';
