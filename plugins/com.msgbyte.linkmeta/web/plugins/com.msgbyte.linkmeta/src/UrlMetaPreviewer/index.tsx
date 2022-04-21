import React from 'react';
import { useAsync } from '@capital/common';
import { LoadingSpinner, Image } from '@capital/component';
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
        <div className="main">
          <div className="summary" onClick={() => window.open(meta.url)}>
            <div className="title">{get(meta, 'title')}</div>
            <div className="description">{get(meta, 'description')}</div>
          </div>
          {get(meta, 'images.0') && (
            <div className="image">
              <Image preview={true} src={get(meta, 'images.0')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
UrlMetaPreviewer.displayName = 'UrlMetaPreviewer';
