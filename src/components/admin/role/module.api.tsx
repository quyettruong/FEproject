import { Card, Col, Collapse, Row, Tooltip } from 'antd';
import { ProFormSwitch } from '@ant-design/pro-components';
import { grey } from '@ant-design/colors';
import { colorMethod, groupByPermission } from '@/config/utils';
import { IPermission, IRole } from '@/types/backend';
import 'styles/reset.scss';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useEffect } from 'react';
import type { CollapseProps } from 'antd';

const { Panel } = Collapse;

interface IProps {
  onChange?: (data: any[]) => void;
  onReset?: () => void;
  form: ProFormInstance;
  listPermissions: {
    module: string;
    permissions: IPermission[]
  }[] | null;

  singleRole: IRole | null;
  openModal: boolean;
};

const ModuleApi = (props: IProps) => {
  const { form, listPermissions, singleRole, openModal } = props;

  useEffect(() => {
    if (listPermissions?.length && singleRole?.id && openModal === true) {

      //current permissions of role
      const userPermissions = groupByPermission(singleRole.permissions);

      let p: any = {};

      listPermissions.forEach(x => {
        let allCheck = true;
        x.permissions?.forEach(y => {
          const temp = userPermissions.find(z => z.module === x.module);

          p[y.id!] = false;

          if (temp) {
            const isExist = temp.permissions.find(k => k.id === y.id);
            if (isExist) {
              // form.setFieldValue(["permissions", y.id as string], true);
              p[y.id!] = true;
            } else allCheck = false;
          } else {
            allCheck = false;
          }
        })


        // form.setFieldValue(["permissions", x.module], allCheck);
        p[x.module] = allCheck;

      })

      form.setFieldsValue({
        name: singleRole.name,
        active: singleRole.active,
        description: singleRole.description,
        permissions: p
      })

    }
  }, [openModal])

  const handleSwitchAll = (value: boolean, name: string) => {
    const child = listPermissions?.find(item => item.module === name);
    if (child) {
      child?.permissions?.forEach(item => {
        if (item.id)
          form.setFieldValue(["permissions", item.id], value)
      })
    }
  }

  const handleSingleCheck = (value: boolean, child: string, parent: string) => {
    form.setFieldValue(["permissions", child], value);

    //check all
    const temp = listPermissions?.find(item => item.module === parent);
    if (temp?.module) {
      const restPermission = temp?.permissions?.filter(item => item.id !== child);
      if (restPermission && restPermission.length) {
        const allTrue = restPermission.every(item => form.getFieldValue(["permissions", item.id as string]));
        form.setFieldValue(["permissions", parent], allTrue && value)
      }
    }

  }


  // Convert the data structure for use with `items` prop
  const panels: CollapseProps['items'] = listPermissions?.map((item, index) => ({
    key: `${index}-parent`,
    label: <div>{item.module}</div>,
    forceRender: true,
    extra: (
      <div className="customize-form-item">
        <ProFormSwitch
          name={["permissions", item.module]}
          fieldProps={{
            defaultChecked: false,
            onClick: (u, e) => { e.stopPropagation() },
            onChange: (value) => handleSwitchAll(value, item.module),
          }}
        />
      </div>
    ),
    children: (
      <Row gutter={[16, 16]}>
        {
          item.permissions?.map((value, i: number) => (
            <Col lg={12} md={12} sm={24} key={`${i}-child-${item.module}`}>
              <Card size="small" bodyStyle={{ display: "flex", flex: 1, flexDirection: 'row' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ProFormSwitch
                    name={["permissions", value.id as string]}
                    fieldProps={{
                      defaultChecked: false,
                      onChange: (v) => handleSingleCheck(v, (value.id) as string, item.module)
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Tooltip title={value?.name}>
                    <p style={{ paddingLeft: 10, marginBottom: 3 }}>{value?.name || ''}</p>
                    <div style={{ display: 'flex' }}>
                      <p style={{ paddingLeft: 10, fontWeight: 'bold', marginBottom: 0, color: colorMethod(value?.method as string) }}>{value?.method || ''}</p>
                      <p style={{ paddingLeft: 10, marginBottom: 0, color: grey[5] }}>{value?.apiPath || ''}</p>
                    </div>
                  </Tooltip>
                </div>
              </Card>
            </Col>
          ))
        }
      </Row>
    )
  }));
  return (
    <Card size="small" bordered={false}>
      <Collapse items={panels} />
    </Card>
  );
};

export default ModuleApi;
