import React from 'react';
import { useFormikContext } from "formik";

import Button from '../common/CustomButton';


const CustomFormButton = ({
    ...props
}) => {
    const { handleSubmit } = useFormikContext();

    return (
        <Button
            onPress={handleSubmit}
            {...props}
        ></Button>
    )
}

export default CustomFormButton

