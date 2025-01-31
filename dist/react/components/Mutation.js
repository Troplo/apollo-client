import * as PropTypes from "prop-types";
import { useMutation } from "../hooks/index.js";
export function Mutation(props) {
    var _a = useMutation(props.mutation, props), runMutation = _a[0], result = _a[1];
    return props.children ? props.children(runMutation, result) : null;
}
Mutation.propTypes = {
    mutation: PropTypes.object.isRequired,
    variables: PropTypes.object,
    optimisticResponse: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    refetchQueries: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
        PropTypes.func,
    ]),
    awaitRefetchQueries: PropTypes.bool,
    update: PropTypes.func,
    children: PropTypes.func.isRequired,
    onCompleted: PropTypes.func,
    onError: PropTypes.func,
    fetchPolicy: PropTypes.string,
};
//# sourceMappingURL=Mutation.js.map