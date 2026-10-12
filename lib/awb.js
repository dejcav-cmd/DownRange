// Case-insensitive: stateProfile.awbStatus may be 'none', 'None', 'Full', 'Banned', 'partial'...
export function hasAwb(v) {
  if (v === true) return true
  if (!v) return false
  return !/^(none|no|false|0)$/i.test(String(v).trim())
}
