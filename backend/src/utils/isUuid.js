// http://stackoverflow.com/a/13653180/458610
const isUuid = s =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  )

module.exports = isUuid
