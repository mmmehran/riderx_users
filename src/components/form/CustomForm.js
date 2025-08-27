import React from 'react';
import { Formik } from "formik";


const CustomForm = ({
    initialValues,
    onSubmit,
    validationSchema,
    children,
    innerRef,
}) => {
    return (
        <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            validationSchema={validationSchema}
            innerRef={innerRef}
        >
            {children}
        </Formik>
    )
}

export default CustomForm

