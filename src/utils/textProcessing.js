function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizePlainText(value) {
  return value
    .replace(/\r/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function compactWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function convertPlainTextToHtml(text) {
  const normalized = normalizePlainText(text);

  if (!normalized) {
    return '<p>No extracted text was returned for this page.</p>';
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`)
    .join('');
}

function extractUsefulTextFromJson(rawText) {
  const trimmed = rawText.trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const collected = [];

    const visit = (value, key = '') => {
      if (value == null) {
        return;
      }

      if (typeof value === 'string') {
        const normalized = normalizePlainText(value);

        if (!normalized) {
          return;
        }

        const lowerKey = key.toLowerCase();
        const looksLikeMetadataKey = [
          'id',
          'uuid',
          'slug',
          'lang',
          'locale',
          'type',
          'mime',
          'format',
          'status',
          'code',
          'url',
          'uri',
          'path',
          'created',
          'updated',
          'timestamp',
          'date',
          'author',
          'image',
          'icon',
          'schema',
          'version',
        ].some((token) => lowerKey.includes(token));

        const looksLikeContent =
          lowerKey.includes('content') ||
          lowerKey.includes('text') ||
          lowerKey.includes('description') ||
          lowerKey.includes('summary') ||
          lowerKey.includes('body') ||
          lowerKey.includes('excerpt') ||
          normalized.split(/\s+/).length >= 8;

        if (looksLikeContent && !looksLikeMetadataKey) {
          collected.push(normalized);
        }

        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, key));
        return;
      }

      if (typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
      }
    };

    visit(parsed);

    const uniqueBlocks = Array.from(new Set(collected.filter(Boolean)));
    return uniqueBlocks.join('\n\n').trim();
  } catch {
    return null;
  }
}

export {
  escapeHtml,
  normalizePlainText,
  compactWhitespace,
  convertPlainTextToHtml,
  extractUsefulTextFromJson,
};
