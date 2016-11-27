function Maybe(props) {
  return props.when ? props.children : false
}

export default Maybe
